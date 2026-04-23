/*
 Copyright (C) 2025 3NSoft Inc.

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
import { Nullable } from '@v1nt1248/3nclient-lib';
import { fileStoreSrv } from '@common/services/services-provider';
import type { AttachmentInfo } from '@common/types';

export async function getFileByInfoFromMsg(
  attachment: AttachmentInfo,
  incomingMsgId?: string,
): Promise<Nullable<web3n.files.ReadonlyFile>> {
  const { id, fileName } = attachment;

  if (incomingMsgId) {
    const msg = await w3n.mail?.inbox.getMsg(incomingMsgId);
    if (!msg) {
      return null;
    }

    const file = await msg.attachments?.readonlyFile(fileName);

    return file || null;
  }

  const fileId = id || fileName;
  const file = await fileStoreSrv.getFile(fileId);
  return file || null;
}
