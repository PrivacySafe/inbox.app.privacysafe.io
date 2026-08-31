/*
 Copyright (C) 2026 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { CATCH_UP_REWIND_MS, INBOX_SCAN_FLOOR_MS } from '../../../shared/constants/sync.ts';
import { makeLogger } from '../../../shared/utils/logger.ts';
import { NamedProcs } from '../../../shared/utils/processes/named-procs.ts';
import type { DBProvider } from '../../dataset/index.ts';
import { MAIL_SYNC_MSG_TYPE } from '../../types/mail-sync.types.ts';
import type { InboxEmit } from '../inbox-service/events.ts';
import { handleDeliveryProgress, isMailSyncDelivery } from '../inbox-service/utils/send.ts';
import type { SyncActivityTracker } from '../sync/sync-activity.ts';
import type { SyncOutbox } from '../sync/sync-outbox.ts';
import { routeIncomingMsg, type IncomingRouterCtx } from './route-incoming.ts';
import { makeFailureFloor, makeWatermarkCommitter } from './watermark.ts';

const log = makeLogger('InboxMail');

export interface MailServiceDeps {
  db: DBProvider;
  emit: InboxEmit;
  /** Where a phantom's delivery outcome goes. */
  sync: SyncOutbox;
  /** Stores an ordinary mail message; also drains phantoms buffered for it. */
  persistMail: IncomingRouterCtx['persistMail'];
  /** The receiving tract of synchronization. */
  handleSync: IncomingRouterCtx['handleSync'];
  activity?: SyncActivityTracker;
}

export async function mailService({
  db,
  emit,
  sync,
  persistMail,
  handleSync,
  activity,
}: MailServiceDeps): Promise<() => void> {
  const process = new NamedProcs();
  const failureFloor = makeFailureFloor();
  const watermark = makeWatermarkCommitter(db, emit, failureFloor);

  /**
   * Guards against handling one inbox message twice - which a message arriving
   * around the start can be, being seen both by the live subscription and by the
   * catch-up scan.
   *
   * Idempotency is not the whole of it: observeSyncStamp must not observe one
   * stamp twice, and scheduleInboxMsgRemoval must not be handed a second
   * scheduling (it is INSERT OR IGNORE, but relying on that in two places is not
   * a reason to have two).
   */
  const seenMsgIds = new Set<string>();

  const routerCtx = (notify: boolean): IncomingRouterCtx => ({ persistMail, handleSync, notify });

  async function handleOne(
    msg: web3n.asmail.IncomingMessage,
    opts: { notify: boolean },
  ): Promise<void> {
    if (seenMsgIds.has(msg.msgId)) {
      return;
    }
    seenMsgIds.add(msg.msgId);

    try {
      const handled = await routeIncomingMsg(msg, routerCtx(opts.notify));
      if (handled) {
        watermark.recordProcessed(msg.deliveryTS);
      } else {
        failureFloor.recordFailure(msg.deliveryTS);
      }
    } catch (err) {
      // The watermark must not go past a message that threw, or the next scan
      // will never list it again.
      failureFloor.recordFailure(msg.deliveryTS);
      // Handled once means handled: leaving it in `seenMsgIds` keeps a live
      // message and the scan from both taking a failing message on.
      log.error(`Handling incoming message ${msg.msgId} threw`, err);
    }

    if (watermark.isBatchFull()) {
      await watermark.commit().catch(err => log.warn(`Batch commit of the watermark failed`, err));
    }
  }

  // The subscription goes on BEFORE the catch-up scan. The other way round, a
  // message that arrives while the scan is running is lost until the next start.
  const unsubInbox = w3n.mail?.inbox.subscribe('message', {
    next: msg => {
      process
        .startOrChain(msg.msgId, () => handleOne(msg, { notify: true }))
        .then(() => watermark.commit())
        .catch(err => log.error(`Failed to handle incoming ${msg.msgId}`, err));
    },
    error: (err: unknown) => {
      log.error('Error in the operation of the receiving service.', err);
    },
    complete: () => {
      log.info('The receiving service has finished.');
    },
  });

  /**
   * Replays what the inbox holds since the watermark.
   *
   * The listing starts CATCH_UP_REWIND_MS before it, because the commit is per
   * batch and takes the GREATEST processed deliveryTS: a message with a smaller
   * one that was not processed - for any reason - would otherwise be jumped
   * over.
   */
  async function catchUp(): Promise<void> {
    activity?.beginCatchUpScan();
    try {
      const watermarkTs = db.getAppState().lastReceivingTimestamp || 0;
      // Floored, not clamped at zero: a zero fromTS is what makes the platform's
      // inbox index throw instead of listing. See INBOX_SCAN_FLOOR_MS.
      const scanFrom = Math.max(watermarkTs - CATCH_UP_REWIND_MS, INBOX_SCAN_FLOOR_MS);
      const listed = await w3n.mail?.inbox.listMsgs(scanFrom).catch(err => {
        const exc = err as web3n.files.FileException;
        if ((exc?.type === 'file') && exc.notFound) {
          log.error(
            `The platform's inbox index is broken: it looks for a shard file `
              + `${exc.path} that does not exist. Only live messages will be handled until `
              + `the platform is updated.`,
            err,
          );
        } else {
          log.error(`Failed to list the inbox from ${scanFrom}`, err);
        }
        return undefined;
      });

      if (!listed) {
        log.info(
          `Catch-up got no listing (watermark ${watermarkTs}); only live messages will `
            + `be handled.`,
        );
        return;
      }

      const thisDeviceId = db.getAppDeviceId();
      let mail = 0;
      let phantoms = 0;
      let ownPhantoms = 0;
      let failed = 0;

      for (const item of listed) {
        if (item.msgType === 'mail') {
          mail += 1;
        } else if (item.msgType === MAIL_SYNC_MSG_TYPE) {
          phantoms += 1;
        } else {
          // Another app's traffic: not fetched, and its body not read.
          continue;
        }

        try {
          const msg = await w3n.mail?.inbox.getMsg(item.msgId);
          if (!msg) {
            // An unavailable message has to be seen by the next scan too, so the
            // watermark is not allowed past it.
            failed += 1;
            failureFloor.recordFailure(item.deliveryTS);
            log.error(`getMsg(${item.msgId}) returned nothing (deliveryTS ${item.deliveryTS})`);
            continue;
          }
          if (
            (item.msgType === MAIL_SYNC_MSG_TYPE)
            && ((msg as { jsonBody?: { sourceDeviceId?: string } }).jsonBody?.sourceDeviceId
              === thisDeviceId)
          ) {
            ownPhantoms += 1;
          }
          await process.startOrChain(item.msgId, () => handleOne(msg, { notify: false }));
        } catch (err) {
          failed += 1;
          failureFloor.recordFailure(item.deliveryTS);
          log.error(`Failed to catch up message ${item.msgId}`, err);
        }
      }

      await watermark.commit().catch(err => log.error(`Final watermark commit failed`, err));

      // "N sync (N of them from this device)" on TWO devices at once is the only
      // outward sign that both copies are reading one data folder - which looks
      // exactly like broken synchronization and nothing else in the logs
      // contradicts it.
      log.info(
        `Catch-up: watermark ${watermarkTs}, listed ${listed.length} since ${scanFrom}, `
          + `${mail} mail, ${phantoms} sync (${ownPhantoms} of them from this device `
          + `${thisDeviceId}), ${failed} failed`,
      );
    } finally {
      activity?.endCatchUpScan();
    }
  }

  await catchUp();

  const routeDelivery = (id: string, progress: web3n.asmail.DeliveryProgress) =>
    (isMailSyncDelivery(progress)
      ? sync.noteDeliveryOutcome(id, progress).then(() => {})
      : handleDeliveryProgress(db, emit, id, progress, sync));

  const sendingList = await w3n.mail?.delivery.listMsgs();
  for (const item of sendingList || []) {
    if (!item.info?.localMeta?.chatId) {
      await routeDelivery(item.id, item.info);
    }
  }

  const unsubDelivery = w3n.mail?.delivery.observeAllDeliveries({
    next: ({ id, progress }) => {
      process
        .startOrChain(id, () => routeDelivery(id, progress))
        .catch(err => log.error(`Failed to handle delivery ${id}`, err));
    },
    error: (err: unknown) => {
      log.error('Error while the message send.', err);
    },
  });

  log.info('mail service started');

  return () => {
    unsubInbox?.();
    unsubDelivery?.();
    sync.stop();
  };
}
