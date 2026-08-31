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
import type { SYSTEM_FOLDERS } from '../../src/common/constants/mail-folders-default.ts';

export type SyncEntityType = 'msg' | 'folder';

/**
 * Which part of an entity a change is about.
 *
 * Aspects exist because two columns of `messages` mix independent sources of
 * truth. `status` carries both the outcome of sending ('draft'|'sending'|
 * 'sent'|'error'|'canceled', written by the delivery hook) and the read state
 * of an incoming message ('received'|'read', written by the user); `mailFolder`
 * carries both "where a message belongs by its own state" and "where the user
 * put it". Last-write-wins over either column whole would let a restore from
 * trash on one device clobber a delivery outcome from another.
 *
 * Every aspect here is a function of the record and of nothing else - that is
 * what lets diffMsgAspects() work out what a change was about without the
 * caller saying so.
 */
export type SyncAspect =
  /** msg: the record itself - subject, bodies, recipients, threadId, cTime, attachmentsInfo. */
  | 'content'
  /** msg (incoming): read or not. One bit, deliberately not the `status` string. */
  | 'read'
  /** msg: where the user put it - home | trash | a folder. */
  | 'placement'
  /** msg (outgoing): the outcome of sending - status, statusDescription, deliveryTS, home. */
  | 'delivery'
  /** folder: name, icon, colour, position, path. */
  | 'folderProps'
  /** Tombstone of an entity. */
  | 'deleted';

/**
 * Ordering token of a change, used to resolve conflicts between the user's own
 * devices by last-write-wins.
 *
 * `ts` comes from the hybrid logical clock (nextSyncStamp() in dataset), and
 * `deviceId` from getAppDeviceId().
 */
export interface SyncToken {
  ts: number;
  deviceId: string;
}

export interface SyncVersionDbEntry extends SyncToken {
  /** Set only for the 'deleted' aspect: these rows outlive the entity. */
  tombstonedAt?: number | null;
}

export interface SyncVersionWrite extends SyncToken {
  entityType: SyncEntityType;
  entityId: string;
  aspect: SyncAspect;
  tombstonedAt?: number;
  /** Does what recordDeletion() does: drops the entity's other aspect versions. */
  dropOtherAspects?: boolean;
}

export interface PendingSyncMsgEntry {
  entityType: SyncEntityType;
  entityId: string;
  aspect: SyncAspect;
  /**
   * How many entities the phantom covers. A row covering more than one does not
   * take part in superseding: the row is described by the first version written,
   * while it carries more than its columns name.
   */
  entityCount: number;
  ts: number;
  payload: string;
}

export interface PendingSyncMsgDbEntry extends PendingSyncMsgEntry {
  id: number;
  attempts: number;
}

export interface OrphanedSyncEntry {
  targetMsgId: string;
  /** The time of the *change*, not of the buffering: the drain goes by it. */
  ts: number;
  rawPayload: string;
  bufferedAt: number;
}

export interface OrphanedSyncDbEntry extends OrphanedSyncEntry {
  id: number;
}

/**
 * Where a message sits because the user put it there.
 *
 * Deliberately in a reduced alphabet that never names the system folder of
 * outgoing mail: 'home' means "wherever this message belongs by its own state",
 * which each device works out from its own knowledge of the delivery outcome
 * (see homeFolderOf). That is what keeps a restore from trash from being a
 * claim about a folder, and hence from ever arguing with a delivery outcome.
 */
export type MsgPlacement =
  | { at: 'home' }
  | { at: 'trash' }
  | { at: 'folder'; folderId: string };

/** The 'home' folder of an outgoing record, as its author sees it. */
export type MsgHomeFolder = SYSTEM_FOLDERS.draft | SYSTEM_FOLDERS.outbox | SYSTEM_FOLDERS.sent;

export interface MsgDeliveryState {
  status: 'draft' | 'sending' | 'sent' | 'error' | 'canceled';
  statusDescription?: Record<string, string>;
  deliveryTS?: number;
  /**
   * Where the author device says the record belongs "at home": draft|outbox|sent.
   *
   * Named rather than recomputed by the receiver from `status`, because the rule
   * handleDeliveryProgress() applies ("every recipient refused -> outbox, else
   * sent") knows something about recipients that the phantom does not carry.
   */
  home: MsgHomeFolder;
}
