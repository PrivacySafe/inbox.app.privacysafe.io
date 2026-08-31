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
import { LOGO_ICON_AS_ARRAY } from '../../../../src/common/constants/files.ts';
import { makeLogger } from '../../../../shared/utils/logger.ts';

const log = makeLogger('InboxNotify');

export async function notifyNewIncomingMail(sender: string, subject: string, msgId: string): Promise<void> {
  try {
    await w3n.shell?.userNotifications?.addNotification({
      icon: Uint8Array.from(LOGO_ICON_AS_ARRAY),
      title: sender,
      body: (subject || '').slice(0, 50),
      cmd: { cmd: 'open-inbox-msg', params: [{ msgId }] },
    });
  } catch (err) {
    log.error(`Failed to show OS notification for message ${msgId}`, err);
  }
}
