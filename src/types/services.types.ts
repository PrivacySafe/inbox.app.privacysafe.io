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
import type { Person, PersonView } from './contacts.types';
import { IncomingMessage, OutgoingMessage, SendingMessageStatus } from './mail.types';

/**
 * This service comes from contacts app
 */
export interface AppContacts {
  getContact(id: string): Promise<Person>;

  getContactList(): Promise<PersonView[]>;

  upsertContact(value: Person): Promise<void>;
}

/**
 * This app's service.
 * It is a singleton in "background instance" component.
 * This service does ASMail sending.
 */
export interface AppDeliverySrv {
  addMessageToDeliveryList(message: OutgoingMessage, systemMessage?: boolean): Promise<void>;

  removeMessageFromDeliveryList(msgIds: string[]): Promise<void>;

  getMessage(msgId: string): Promise<IncomingMessage | undefined>;

  getDeliveryList(): Promise<SendingMessageStatus[]>;

  removeMessageFromInbox(msgIds: string[]): Promise<void>;
}

/**
 * This app's service.
 * It is a singleton in "background instance" component.
 * This service does ASMail sending.
 */
export interface AppDeliveryService {
  watchIncomingMessages(obs: web3n.Observer<IncomingMessage>): () => void;

  watchOutgoingMessages(obs: web3n.Observer<{ id: string; progress: web3n.asmail.DeliveryProgress }>): () => void;
}

export interface FileLinkStoreService {
  saveLink(file: web3n.files.ReadonlyFile): Promise<string>;

  getLink(fileId: string): Promise<web3n.files.SymLink | null | undefined>;

  getFile(fileId: string): Promise<web3n.files.Linkable | null | undefined>;

  deleteLink(fileId: string): Promise<void>;
}
