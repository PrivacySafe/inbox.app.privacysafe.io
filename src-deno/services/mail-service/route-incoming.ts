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

/**
 * The one place an inbox message is decided about.
 *
 * The `msgType === 'mail'` filter used to live in two - in the subscription and
 * inside catchUpIncomingMail - and with phantoms in the picture the
 * deduplication and the watermark would have had to live in two places as well,
 * and would have drifted.
 */

import type { IncomingMessage } from '../../../src/common/types/mail.types.ts';
import { makeLogger } from '../../../shared/utils/logger.ts';
import { MAIL_SYNC_MSG_TYPE } from '../../types/mail-sync.types.ts';

const log = makeLogger('InboxRouter');

export interface IncomingRouterCtx {
  /** Stores an ordinary mail message. */
  persistMail(msg: IncomingMessage, opts?: { notify?: boolean }): Promise<void>;
  /** Handles a message of the synchronization type. */
  handleSync(msg: web3n.asmail.IncomingMessage): Promise<boolean>;
  /** Whether the user is to be notified of a new message. */
  notify: boolean;
}

/**
 * @returns true when the message was handled, i.e. its deliveryTS may be
 *          counted into the watermark. A message of a type this app has no
 *          business with counts as handled too: it is not going to become
 *          handleable later, and holding the watermark for it would make every
 *          start re-list the inbox from the same point.
 */
export async function routeIncomingMsg(
  msg: web3n.asmail.IncomingMessage,
  ctx: IncomingRouterCtx,
): Promise<boolean> {
  if (msg.msgType === 'mail') {
    await ctx.persistMail(msg as IncomingMessage, { notify: ctx.notify });
    return true;
  }

  if (msg.msgType === MAIL_SYNC_MSG_TYPE) {
    return ctx.handleSync(msg);
  }

  // 'chat', 'webrtc-signaling', another app's `app:*`. Not touched and not
  // removed: the inbox is shared not only between the user's devices, but
  // between their applications. The body is not read at all.
  log.debug(`Ignoring inbox message ${msg.msgId} of type ${msg.msgType}.`);
  return true;
}

/** Whether the router will look at this message's body at all. */
export function isMsgOfThisApp(msgType: string | undefined): boolean {
  return (msgType === 'mail') || (msgType === MAIL_SYNC_MSG_TYPE);
}
