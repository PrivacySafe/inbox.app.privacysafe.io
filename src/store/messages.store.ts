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
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import hasIn from 'lodash/hasIn';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import uniq from 'lodash/uniq';
import { NamedProcs } from '@v1nt1248/3nclient-lib/utils';
import { dbSrv, fileStoreSrv } from '@/services/services-provider';
import { useAppStore } from '@/store/app.store';
import { SYSTEM_FOLDERS } from '@/constants';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { AttachmentInfo, IncomingMessageView, OutgoingMessageView } from '@/types';
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog/confirmation-dialog.vue';
import { FileInfo } from '@/services/labelled-file-store';
import size from 'lodash/size';

const SUBJECT_TEXT_LENGTH = 50;

export const useMessagesStore = defineStore('messages', () => {
  const procs = new NamedProcs();
  const appStore = useAppStore();
  const { $dialogs, $i18n, setAppState } = appStore;

  const messageList = ref<Record<string, IncomingMessageView | OutgoingMessageView>>({});

  const messagesByFolders = computed(() => {
    return Object.values(messageList.value).reduce(
      (res, msg) => {
        const { mailFolder, msgId } = msg;

        if (!res[mailFolder]) {
          res[mailFolder] = {};
        }

        res[mailFolder][msgId!] = msg;

        return res;
      },
      {} as Record<string, Record<string, IncomingMessageView | OutgoingMessageView>>,
    );
  });

  async function getMessages() {
    const messages = dbSrv.getMessages();
    if (!appStore.appState?.lastReceivingTimestamp) {
      const newLastReceivingTimestamp = messages.reduce((acc, msg) => {
        if (msg.deliveryTS > acc) {
          acc = msg.deliveryTS;
        }

        return acc;
      }, 0);
      await setAppState({ lastReceivingTimestamp: newLastReceivingTimestamp + 1 });
    }

    messageList.value = (messages || []).reduce(
      (res, msg) => {
        res[msg.msgId!] = {
          ...msg,
          subject: msg.subject ? msg.subject.slice(0, SUBJECT_TEXT_LENGTH) : '',
        };

        return res;
      },
      {} as Record<string, IncomingMessageView | OutgoingMessageView>,
    );
  }

  function getMessage(msgId: string): Nullable<IncomingMessageView | OutgoingMessageView> {
    return dbSrv.getMessageById(msgId);
  }

  async function _upsertMessage(messageData: IncomingMessageView | OutgoingMessageView) {
    const { msgId } = messageData;
    const isMsgPresent = hasIn(messageList.value, msgId!);

    if (isMsgPresent) {
      await dbSrv.updateMessage(messageData);
    } else {
      await dbSrv.addMessage(messageData);
    }

    messageList.value[messageData.msgId!] = messageData;
  }

  async function upsertMessage(messageData: IncomingMessageView | OutgoingMessageView) {
    return procs.startOrChain(messageData.msgId, async () => await _upsertMessage(messageData));
  }

  async function moveToTrash(message: IncomingMessageView | OutgoingMessageView) {
    const updatedMessage = {
      ...message,
      mailFolder: SYSTEM_FOLDERS.trash,
    };
    await upsertMessage(updatedMessage);
    await getMessages();
  }

  async function deleteMessages(messageIds: string[] = [], withReload?: boolean) {
    const countOfMessagesToDelete = messageIds.length;
    const incomingMessages: string[] = [];
    const outgoingMessages: string[] = [];
    let filesIds: string[] = [];

    for (let i = 0; i < countOfMessagesToDelete; i++) {
      const msgId = messageIds[i];
      const msg = messageList.value[msgId];
      const isMsgIncoming = hasIn(msg, 'sender') && hasIn(msg, 'deliveryTS');

      if (isMsgIncoming) {
        incomingMessages.push(msgId);
      } else {
        outgoingMessages.push(msgId);

        const msgAttachmentIds = get(msg, 'attachmentsInfo', []).map(item => item.id!);
        if (!isEmpty(msgAttachmentIds)) {
          filesIds = [...filesIds, ...msgAttachmentIds];
        }
      }

      await dbSrv.deleteMessageById(msgId, i < countOfMessagesToDelete - 1);
      delete messageList.value[msgId];
    }

    withReload && await getMessages();

    if (!isEmpty(uniq(filesIds))) {
      // The file attached to a deleted message can be used as an attachment in other, non-deleted, messages
      for (const fileId of uniq(filesIds)) {
        const { messages = [] } = (await fileStoreSrv.getInfo(fileId)) as FileInfo;
        const updatedMessages = messages.filter(mId => !messageIds.includes(mId));

        if (size(updatedMessages) > 0) {
          await fileStoreSrv.updateInfo(fileId, { messages: updatedMessages });
        } else {
          await fileStoreSrv.delete(fileId);
        }
      }
    }

    if (!isEmpty(incomingMessages)) {
      const pr = incomingMessages.map(msgId => w3n.mail?.inbox.removeMsg(msgId));
      await Promise.allSettled(pr);
    }

    if (!isEmpty(outgoingMessages)) {
      const deliveryList = await w3n.mail?.delivery.listMsgs();
      const deliveryListIds = (deliveryList || []).reduce((res, item) => {
        if (outgoingMessages.includes(item.id)) {
          res.push(item.id);
        }

        return res;
      }, [] as string[]);
      const pr = deliveryListIds.map(msgId => w3n.mail?.delivery.rmMsg(msgId));
      await Promise.allSettled(pr);
    }
  }

  async function deleteMessagesUi(messageIds: string[] = [], withReload?: boolean) {
    return new Promise(resolve => {
      $dialogs.open<typeof ConfirmationDialog>({
        component: ConfirmationDialog,
        componentProps: {
          dialogText: $i18n.tr('msg.delete.permanently.string1'),
          additionalDialogText: $i18n.tr('msg.delete.permanently.string2'),
        },
        dialogProps: {
          title: $i18n.tr('msg.delete.permanently.title'),
          width: 440,
          confirmButtonText: $i18n.tr('msg.delete.permanently.confirm.button'),
          confirmButtonBackground: 'var(--error-content-default)',
          confirmButtonColor: 'var(--error-fill-default)',
          onConfirm: async () => {
            try {
              await deleteMessages(messageIds, withReload);
              resolve(true);
            } catch (error) {
              w3n.log('error', `Error while delete messages ${messageIds.join(', ')}`, error);
              resolve(false);
            }
          },
        },
      });
    });
  }

  async function downloadFileFromOutgoingMessage(attachment: AttachmentInfo) {
    if (!attachment?.id) {
      throw new Error(`This attachment has not id [${JSON.stringify(attachment)}]`);
    }

    // @ts-ignore
    const targetFile = await w3n.shell?.fileDialogs?.saveFileDialog(
      $i18n.tr('msg.download.file.title'),
      $i18n.tr('app.ok'),
      attachment.fileName,
    );

    if (targetFile) {
      await fileStoreSrv.downloadFile(attachment.id, targetFile);
      return true;
    } else {
      return null;
    }
  }

  async function downloadFilesFromOutgoingMessage(msgId: string, ids: string[] = []) {
    if (isEmpty(ids)) {
      throw new Error(`The message's ${msgId} attachments is empty`);
    }

    // @ts-ignore
    const targetFs = await w3n.shell?.fileDialogs?.saveFolderDialog(
      $i18n.tr('msg.download.title'),
      $i18n.tr('app.ok'),
      msgId,
    );

    if (targetFs) {
      await fileStoreSrv.downloadFiles(ids, targetFs);
      return true;
    }

    return null;
  }

  return {
    messageList,
    messagesByFolders,
    getMessages,
    getMessage,
    upsertMessage,
    moveToTrash,
    deleteMessagesUi,
    deleteMessages,
    downloadFileFromOutgoingMessage,
    downloadFilesFromOutgoingMessage,
  };
});
