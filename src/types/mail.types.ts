/*
 Copyright (C) 2024-2025 3NSoft Inc.

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
import type { Nullable } from '@v1nt1248/3nclient-lib';

export type MailFolder = {
  id: string;
  name: string;
  icon?: Nullable<string>;
  iconColor?: Nullable<string>;
  position: number;
  path: string;
  isSystem: boolean;
};

export type MailFolderDB = {
  id: string;
  name: string;
  icon: Nullable<string>;
  iconColor: Nullable<string>;
  position: number;
  path: string;
  isSystem: number;
};

export type DbQueryParams<T, K extends string & keyof T> = {
  [p in `$${K}`]: T[K];
};

export type MessageDeliveryStatus = 'draft' | 'sending' | 'sent' | 'error' | 'canceled' | 'received' | 'read';

export interface MessageDeliveryInfo {
  msgId: string;
  status: MessageDeliveryStatus;
  value: string | number;
}

export interface SendingMessageStatus {
  msgId?: string;
  status: web3n.asmail.DeliveryProgress | undefined;
  info: MessageDeliveryInfo | undefined;
}

export type MessageKind = 'regular' | 'system';

export interface MessageJsonBody {
  threadId: string;
  msgKind: MessageKind;
}

export interface IncomingMessage extends web3n.asmail.IncomingMessage {
  jsonBody: Partial<MessageJsonBody>;
}

export interface OutgoingMessage extends web3n.asmail.OutgoingMessage {
  jsonBody: Partial<MessageJsonBody>;
}

export type AttachmentInfo = {
  id: string;
  fileName: string;
  size: number;
  type?: string;
};

export type PreparedMessageData = {
  id: string;
  threadId: string;
  recipients: string[];
  subject: string;
  attachmentsInfo?: AttachmentInfo[];
  plainTxtBody?: string;
  htmlTxtBody?: string;
};

export type MessageExtraInfo = {
  threadId: string;
  cTime?: number;
  status: MessageDeliveryStatus;
  statusDescription?: string[];
  mailFolder: string;
  attachmentsInfo?: AttachmentInfo[];
};

export type IncomingMessageView = Omit<IncomingMessage, 'establishedSenderKeyChain' | 'attachments'> & MessageExtraInfo & { msgId: string };

export type OutgoingMessageView = Omit<OutgoingMessage, 'attachments'> &
  MessageExtraInfo & {
    msgId: string
    deliveryTS: number;
  };

export type MessageThread = {
  threadId: string;
  isExpanded?: boolean;
  folders: string[];
  lastIncomingTS: number;
  lastOutgoingTS: number;
  messages: Array<IncomingMessageView | OutgoingMessageView>;
};

export type MessageViewDB = {
  msgId: string;
  cTime: Nullable<number>;
  msgType: string; // 'chat' | 'mail'
  deliveryTS: Nullable<number>;
  subject: Nullable<string>;
  plainTxtBody: Nullable<string>;
  htmlTxtBody: Nullable<string>;
  threadId: string;
  jsonBody: string;
  recipients: Nullable<string>;
  sender: Nullable<string>;
  mailFolder: string;
  status: Nullable<string>; // 'draft' | 'sending' | 'sent' | 'error' | 'canceled'
  statusDescription: Nullable<string>;
  attachmentsInfo: Nullable<string>;
};

export type MessageAction = 'move-to-trash' | 'delete' | 'edit' | 'send' | 'mark-as-read' | 'reply' | 'reply-all' | 'forward' | 'restore';

export type MessageBulkActions = 'cancel' | 'move-to-trash' | 'delete' | 'restore';
