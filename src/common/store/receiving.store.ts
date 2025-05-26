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
import { computed } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import get from 'lodash/get';
import { useAppStore } from './app.store';
import { useMessagesStore } from './messages.store';
import { incomingMsgToIncomingMsgView } from '@common/utils';
import type { IncomingMessage } from '@common/types';

export const useReceivingStore = defineStore('receiving', () => {
  const appStore = useAppStore();
  const { appState } = storeToRefs(appStore);
  const { $i18n, setAppState } = appStore;
  const messagesStore = useMessagesStore();
  const { upsertMessage } = messagesStore;

  const lastReceivingTimestamp = computed(() => get(appState.value, 'lastReceivingTimestamp', 0));

  function startReceivingService() {
    w3n.mail?.inbox.subscribe('message', {
      next: async msg => {
        if (msg.msgType === 'mail') {
          console.info(`<-- message with id ${msg.msgId} is received -->`);
          await setAppState({ lastReceivingTimestamp: Date.now() });

          const msgData = await incomingMsgToIncomingMsgView(msg as IncomingMessage);
          await upsertMessage(msgData);
        }
      },
      error: err => {
        w3n.log('error', 'Error in the operation of the receiving service.', err);
      },
      complete: () => {
        w3n.log('info', 'The receiving service has finished.');
      },
    });
  }

  async function initializeReceivingService() {
    const inboxMsgInfoList = await w3n.mail?.inbox.listMsgs(lastReceivingTimestamp.value);
    const inboxMailMsgInfoList = (inboxMsgInfoList || []).filter(item => item.msgType === 'mail');

    for (const item of inboxMailMsgInfoList) {
      const msg = (await w3n.mail?.inbox.getMsg(item.msgId)) as IncomingMessage;
      const msgData = await incomingMsgToIncomingMsgView(msg);
      await upsertMessage(msgData);
    }

    startReceivingService();
    console.info('# The receiving service has initialized #');
  }

  async function deleteIncomingMessageFromRemoteInbox(msgId: string) {
    await w3n.mail?.inbox.removeMsg(msgId);
  }

  async function downloadFileFromIncomingMessage(msgId: string, fileName: string) {
    const msg = await w3n.mail?.inbox.getMsg(msgId);
    if (!msg) {
      throw new Error(`The message with ID ${msgId} is not found.`);
    }

    const sourceFile = await msg.attachments?.readonlyFile(fileName);
    if (!sourceFile) {
      throw new Error(`The message with ID '${msgId}' has not the file '${fileName}'.`);
    }

    // @ts-ignore
    const targetFile = await w3n.shell?.fileDialogs?.saveFileDialog(
      $i18n.tr('msg.download.file.title'),
      $i18n.tr('app.ok'),
      sourceFile.name,
    );

    if (targetFile) {
      await targetFile!.copy(sourceFile);
      return true;
    } else {
      return null;
    }
  }

  async function downloadAttachmentsFromIncomingMessage(msgId: string) {
    const msg = await w3n.mail?.inbox.getMsg(msgId);
    if (!msg) {
      throw new Error(`The message with ID ${msgId} is not found.`);
    }

    const sourceFolder = msg.attachments;
    if (!sourceFolder) {
      throw new Error(`The message with ID '${msgId}' has not attachments'.`);
    }

    // @ts-ignore
    const targetFolder = await w3n.shell?.fileDialogs?.saveFolderDialog(
      $i18n.tr('msg.download.title'),
      $i18n.tr('app.ok'),
      msgId,
    );

    if (targetFolder) {
      await targetFolder!.saveFolder(sourceFolder, 'attachments', true);
      return true;
    }

    return null;
  }

  return {
    startReceivingService,
    initializeReceivingService,
    deleteIncomingMessageFromRemoteInbox,
    downloadFileFromIncomingMessage,
    downloadAttachmentsFromIncomingMessage,
  };
});
