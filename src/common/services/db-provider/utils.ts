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
import hasIn from 'lodash/hasIn';
import isEmpty from 'lodash/isEmpty';
import { QueryExecResult } from '@common/libs/sqlite-on-3nstorage';
import type {
  AppState,
  DbQueryParams,
  IncomingMessageView,
  MailFolder,
  MailFolderDB, MessageJsonBody,
  MessageViewDB,
  OutgoingMessageView,
} from 'src/common/types';

type SqlValue = number | string | Uint8Array | Blob | null;

export function objectFromQueryExecResult<T>(sqlResult: QueryExecResult): Array<T> {
  const { columns, values: rows } = sqlResult;
  return rows.map((row: SqlValue[]) =>
    row.reduce((obj, cellValue, index) => {
      const field = columns[index] as keyof T;
      obj[field] = cellValue as T[keyof T];
      return obj;
    }, {} as T),
  );
}

export function appStateValueToSqlInsertParams(state: AppState): DbQueryParams<unknown, keyof unknown> {
  return {
    $id: '0',
    $state: JSON.stringify(state),
  };
}

export function appStateDbValueToAppState(sqlResult: QueryExecResult): AppState {
  const data = objectFromQueryExecResult<AppState>(sqlResult);
  return { ...data[0] };
}

export function folderValueToSqlInsertParams(folderData: MailFolder): DbQueryParams<MailFolderDB, keyof MailFolderDB> {
  const { id, name, icon, iconColor, position, path, isSystem } = folderData;
  return {
    $id: id,
    $name: name,
    $icon: icon || null,
    $iconColor: iconColor || null,
    $position: position,
    $path: path,
    $isSystem: isSystem ? 1 : 0,
  };
}

export function folderDbValueToFolderValue(sqlResult: QueryExecResult): MailFolder[] {
  const data = objectFromQueryExecResult<MailFolderDB>(sqlResult);
  return data.map(item => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    iconColor: item.iconColor,
    position: item.position,
    path: item.path,
    isSystem: !!item.isSystem,
  }));
}

export function msgValueToSqlInsertParams(
  msgData: IncomingMessageView | OutgoingMessageView,
): DbQueryParams<MessageViewDB, keyof MessageViewDB> {
  const isMsgIncoming = hasIn(msgData, 'sender') && hasIn(msgData, 'deliveryTS');
  return {
    $msgId: msgData.msgId!,
    $threadId: msgData.threadId!,
    $msgType: 'mail',
    $cTime: msgData.cTime || null,
    $deliveryTS: isMsgIncoming ? (msgData as IncomingMessageView).deliveryTS : null,
    $subject: msgData.subject || null,
    $plainTxtBody: msgData.plainTxtBody || null,
    $htmlTxtBody: msgData.htmlTxtBody || null,
    $jsonBody: JSON.stringify(msgData.jsonBody),
    $recipients: isEmpty(msgData.recipients) ? null : JSON.stringify(msgData.recipients),
    $sender: isMsgIncoming ? (msgData as IncomingMessageView).sender : null,
    $mailFolder: msgData.mailFolder,
    $status: msgData.status,
    $statusDescription: isEmpty(msgData.statusDescription) ? null : JSON.stringify(msgData.statusDescription),
    $attachmentsInfo: isEmpty(msgData.attachmentsInfo) ? null : JSON.stringify(msgData.attachmentsInfo),
  };
}

export function msgDbValueToMsgValue(sqlResult: QueryExecResult): Array<IncomingMessageView | OutgoingMessageView> {
  const data = objectFromQueryExecResult<MessageViewDB>(sqlResult);
  return data.map(item => ({
    msgId: item.msgId,
    threadId: item.threadId,
    msgType: item.msgType,
    ...(item.cTime && { cTime: item.cTime }),
    ...(item.deliveryTS && { deliveryTS: item.deliveryTS }),
    ...(item.subject && { subject: item.subject }),
    ...(item.plainTxtBody && { plainTxtBody: item.plainTxtBody }),
    ...(item.htmlTxtBody && { htmlTxtBody: item.htmlTxtBody }),
    jsonBody: JSON.parse(item.jsonBody) as MessageJsonBody,
    ...(item.recipients && { recipients: JSON.parse(item.recipients) as string[] }),
    ...(item.sender && { sender: item.sender }),
    mailFolder: item.mailFolder,
    status: item.status,
    ...(item.statusDescription && { statusDescription: JSON.parse(item.statusDescription) }),
    ...(item.attachmentsInfo && { attachmentsInfo: JSON.parse(item.attachmentsInfo) }),
  })) as Array<IncomingMessageView | OutgoingMessageView>;
}
