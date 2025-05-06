/// <reference path="../../libs/sqlite-on-3nstorage/index.d.ts" />
import isEmpty from 'lodash/isEmpty';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import { SQLiteOn3NStorage } from '@/libs/sqlite-on-3nstorage/index.js';
import type { ParamsObject } from '@/libs/sqlite-on-3nstorage/sqljs';
import { MAIL_FOLDERS_DEFAULT } from '@/constants/mail-folders-default';
import type { AppState, IncomingMessageView, MailFolder, OutgoingMessageView } from '@/types';
import type { DBProvider } from './types';
import {
  GET_STATE_QUERY,
  UPSERT_STATE_QUERY,
  INSERT_FOLDER_QUERY,
  GET_FOLDER_LIST_QUERY,
  DELETE_FOLDER_BY_ID_QUERY,
  GET_MESSAGES_QUERY,
  GET_MESSAGE_QUERY_BY_ID,
  INSERT_MESSAGE_QUERY,
  UPSERT_MESSAGE_QUERY,
  DELETE_MESSAGE_BY_ID_QUERY,
} from './queries';
import {
  folderValueToSqlInsertParams,
  folderDbValueToFolderValue,
  msgDbValueToMsgValue,
  msgValueToSqlInsertParams,
  appStateDbValueToAppState,
  appStateValueToSqlInsertParams,
} from './utils';

export async function dbProvider(): Promise<DBProvider> {
  let sqlite: SQLiteOn3NStorage;

  async function initialization() {
    const fs = await w3n.storage!.getAppSyncedFS();
    const file = await fs.writableFile('storage-db');
    sqlite = await SQLiteOn3NStorage.makeAndStart(file);

    // language=SQLite format=false
    sqlite.db.exec(`CREATE TABLE IF NOT EXISTS app (
      id TEXT PRIMARY KEY UNIQUE,
      state TEXT NOT NULL
    ) STRICT`);

    await updateAppState({ lastReceivingTimestamp: 0 }, true);

    // language=SQLite format=false
    sqlite.db.exec(`CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY UNIQUE,
      name TEXT NOT NULL,
      icon TEXT,
      iconColor TEXT,
      position INTEGER NOT NULL,
      path TEXT NOT NULL,
      isSystem INTEGER NOT NULL
    ) STRICT`);

    const folderList = getFolderList();
    if (isEmpty(folderList)) {
      MAIL_FOLDERS_DEFAULT.forEach(folderData => {
        addFolder(folderData, true);
      });
    }

    // language=SQLite format=false
    sqlite.db.exec(`CREATE TABLE IF NOT EXISTS messages (
      msgId TEXT PRIMARY KEY UNIQUE,
      threadId TEXT NOT NULL,
      cTime INTEGER,
      msgType TEXT NOT NULL,
      deliveryTS INTEGER,
      subject TEXT,
      plainTxtBody TEXT,
      htmlTxtBody TEXT,
      jsonBody TEXT NOT NULL,
      recipients TEXT,
      sender TEXT,
      status TEXT,
      statusDescription TEXT,
      attachmentsInfo TEXT,
      mailFolder TEXT NOT NULL,
      FOREIGN KEY (mailFolder) REFERENCES folders (id) ON DELETE CASCADE
    ) STRICT`);

    await sqlite.saveToFile({ skipUpload: true });
  }

  async function saveDbFile() {
    const countModifiedRow = sqlite.db.getRowsModified();
    if (countModifiedRow > 0) {
      await sqlite.saveToFile({ skipUpload: true });
    }
  }

  function getAppState(): AppState {
    const [sqlValue] = sqlite.db.exec(GET_STATE_QUERY);
    if (isEmpty(sqlValue)) return { lastReceivingTimestamp: 0 };

    return appStateDbValueToAppState(sqlValue);
  }

  async function updateAppState(state: AppState, noDiskWrite?: boolean): Promise<void> {
    const sqlQueryParams = appStateValueToSqlInsertParams(state);
    sqlite.db.exec(UPSERT_STATE_QUERY, sqlQueryParams as ParamsObject);
    if (!noDiskWrite) {
      await saveDbFile();
    }
  }

  function getFolderList(): MailFolder[] {
    const [sqlValue] = sqlite.db.exec(GET_FOLDER_LIST_QUERY);
    if (isEmpty(sqlValue)) return [];

    return folderDbValueToFolderValue(sqlValue);
  }

  async function addFolder(folderData: MailFolder, noDiskWrite?: boolean): Promise<MailFolder[]> {
    const sqlQueryParams = folderValueToSqlInsertParams(folderData);
    sqlite.db.exec(INSERT_FOLDER_QUERY, sqlQueryParams as ParamsObject);
    if (!noDiskWrite) {
      await saveDbFile();
    }

    return getFolderList();
  }

  async function deleteFolder(folderData: MailFolder, noDiskWrite?: boolean): Promise<MailFolder[]> {
    if (!folderData.id) {
      throw new Error('[deleteFolder method]: The folder ID is missing.');
    }

    sqlite.db.exec(DELETE_FOLDER_BY_ID_QUERY, { $id: folderData.id });
    if (!noDiskWrite) {
      await saveDbFile();
    }

    return getFolderList();
  }

  function getMessages(): Array<IncomingMessageView | OutgoingMessageView> {
    const [sqlValue] = sqlite.db.exec(GET_MESSAGES_QUERY);
    if (isEmpty(sqlValue)) return [];

    return msgDbValueToMsgValue(sqlValue);
  }

  function getMessageById(msgId: string): Nullable<IncomingMessageView | OutgoingMessageView> {
    if (!msgId) {
      throw new Error('[getMessageById method]: The message ID is missing.');
    }

    const [sqlValue] = sqlite.db.exec(GET_MESSAGE_QUERY_BY_ID, { $msgId: msgId });
    if (isEmpty(sqlValue)) return null;

    const msg = msgDbValueToMsgValue(sqlValue);
    return msg[0];
  }

  async function addMessage(
    msgData: IncomingMessageView | OutgoingMessageView,
    noDiskWrite?: boolean,
  ): Promise<Array<IncomingMessageView | OutgoingMessageView>> {
    if (!msgData.msgId) {
      throw new Error('[addMessage method]: The message ID is missing.');
    }

    const sqlQueryParams = msgValueToSqlInsertParams(msgData);
    sqlite.db.exec(INSERT_MESSAGE_QUERY, sqlQueryParams as ParamsObject);

    if (!noDiskWrite) {
      await saveDbFile();
    }

    return getMessages();
  }

  async function updateMessage(
    msgData: IncomingMessageView | OutgoingMessageView,
    noDiskWrite?: boolean,
  ): Promise<Array<IncomingMessageView | OutgoingMessageView>> {
    if (!msgData.msgId) {
      throw new Error('[updateMessage method]: The message ID is missing.');
    }

    const sqlQueryParams = msgValueToSqlInsertParams(msgData);
    sqlite.db.exec(UPSERT_MESSAGE_QUERY, sqlQueryParams as ParamsObject);

    if (!noDiskWrite) {
      await saveDbFile();
    }

    return getMessages();
  }

  async function deleteMessageById(
    msgId: string,
    noDiskWrite?: boolean,
  ): Promise<Array<IncomingMessageView | OutgoingMessageView>> {
    if (!msgId) {
      throw new Error('[deleteMessage method]: The message ID is missing.');
    }

    sqlite.db.exec(DELETE_MESSAGE_BY_ID_QUERY, { $msgId: msgId });

    if (!noDiskWrite) {
      await saveDbFile();
    }

    return getMessages();
  }

  await initialization();

  return {
    getAppState,
    updateAppState,
    addFolder,
    deleteFolder,
    getFolderList,
    addMessage,
    updateMessage,
    deleteMessageById,
    getMessageById,
    getMessages,
  };
}
