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
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import { fileStoreSrv } from '@common/services/services-provider';
import { SYSTEM_FOLDERS } from '@common/constants';
import {
  AttachmentInfo,
  IncomingMessage,
  IncomingMessageView,
  MessageDeliveryStatus,
  OutgoingMessage,
  OutgoingMessageView,
  PreparedMessageData,
} from '@common/types';

async function attachmentsToAttachmentsInfo(data: web3n.files.ReadonlyFS, msgId: string): Promise<AttachmentInfo[]> {
  const result: AttachmentInfo[] = [];
  const list = await data.listFolder('');
  for (const item of list) {
    if (item.isFile) {
      const stats = await data.stat(item.name);
      result.push({
        id: `${msgId}__${getRandomId(3)}`,
        fileName: item.name,
        size: stats.size!,
        type: 'origin',
      });
    }
  }
  return result;
}

export async function incomingMsgToIncomingMsgView(
  data: IncomingMessage,
  mailFolder = SYSTEM_FOLDERS.inbox,
): Promise<IncomingMessageView> {
  const result: IncomingMessageView = {
    mailFolder,
    status: 'received',
    msgId: data.msgId,
    threadId: data.jsonBody.threadId!,
    msgType: data.msgType,
    deliveryTS: data.deliveryTS,
    sender: data.sender,
    subject: data.subject,
    recipients: data.recipients || [],
    ...(data.plainTxtBody && { plainTxtBody: data.plainTxtBody }),
    ...(data.htmlTxtBody && { htmlTxtBody: data.htmlTxtBody }),
    jsonBody: omit(data.jsonBody, 'threadId'),
    attachmentsInfo: [],
  };

  if (data.attachments) {
    result.attachmentsInfo = await attachmentsToAttachmentsInfo(data.attachments, data.msgId);
  }

  return result;
}

export async function outgoingMsgViewToOutgoingMsg(data: OutgoingMessageView): Promise<OutgoingMessage> {
  const result: OutgoingMessage = {
    msgId: data.msgId,
    msgType: data.msgType,
    subject: data.subject,
    recipients: data.recipients,
    ...(data.plainTxtBody && { plainTxtBody: data.plainTxtBody }),
    ...(data.htmlTxtBody && { htmlTxtBody: data.htmlTxtBody }),
    jsonBody: {
      ...data.jsonBody,
      threadId: data.threadId,
    },
  };

  if (data.attachmentsInfo) {
    const attachments: web3n.asmail.AttachmentsContainer = {
      files: {},
    };

    for (const item of data.attachmentsInfo) {
      const { id, fileName } = item;
      if (id) {
        attachments.files![fileName] = await fileStoreSrv.getFile(id!);
      }
    }

    result.attachments = attachments;
  }

  return result;
}

export function preparedMsgDataToOutgoingMsgView(
  data: PreparedMessageData,
  mailFolder = SYSTEM_FOLDERS.draft,
  status: MessageDeliveryStatus = 'draft',
): OutgoingMessageView {
  const now = Date.now();
  return {
    mailFolder,
    status,
    msgId: data.id,
    threadId: data.threadId,
    cTime: now,
    msgType: 'mail',
    subject: data.subject,
    recipients: data.recipients,
    ...(data.htmlTxtBody && { htmlTxtBody: data.htmlTxtBody }),
    ...(data.plainTxtBody && { plainTxtBody: data.plainTxtBody }),
    jsonBody: {
      threadId: data.threadId,
      msgKind: 'regular',
    },
    ...(!isEmpty(data.attachmentsInfo) && { attachmentsInfo: data.attachmentsInfo }),
    deliveryTS: now,
  };
}

export function msgViewToPreparedMsgData(msg: IncomingMessageView | OutgoingMessageView): PreparedMessageData {
  return {
    id: msg.msgId,
    threadId: msg.threadId!,
    recipients: msg.recipients || [],
    subject: msg.subject || '',
    attachmentsInfo: msg.attachmentsInfo || [],
    htmlTxtBody: msg.htmlTxtBody,
    plainTxtBody: msg.plainTxtBody,
  }
}
