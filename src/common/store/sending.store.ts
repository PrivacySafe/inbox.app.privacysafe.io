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
import { ref } from 'vue';
import { defineStore } from 'pinia';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import get from 'lodash/get';
import size from 'lodash/size';
import { NamedProcs } from '@v1nt1248/3nclient-lib/utils';
import { SYSTEM_FOLDERS } from '@common/constants';
import { handleSendingError, outgoingMsgViewToOutgoingMsg } from '@common/utils';
import { useMessagesStore } from '@common/store/messages.store';
import type { OutgoingMessageView } from '@common/types';

export const useSendingStore = defineStore('sending', () => {
  const messagesStore = useMessagesStore();
  const { getMessage, upsertMessage } = messagesStore;
  const process = new NamedProcs();

  const listOfSendingMessage = ref<Record<string, web3n.asmail.DeliveryProgress>>({});

  function updateListOfSendingMessage(id: string, progress: web3n.asmail.DeliveryProgress) {
    listOfSendingMessage.value[id] = progress;
  }

  function deleteFromListOfSendingMessage(id: string) {
    delete listOfSendingMessage.value[id];
  }

  async function sendMessage(msgData: OutgoingMessageView) {
    const outgoingMessage = await outgoingMsgViewToOutgoingMsg(msgData);
    const { msgId, recipients = [] } = outgoingMessage;
    await process.start(msgId!, async () => {
      await w3n.mail?.delivery.addMsg(recipients, omit(outgoingMessage, 'plainTxtBody'), msgId!);
    });
  }

  async function cancelSendMessage(msgId: string): Promise<void> {
    await removeMessageFromDeliveryList(msgId, true);
  }

  async function removeMessageFromDeliveryList(msgId: string, cancelSending = false): Promise<void> {
    await w3n.mail?.delivery.rmMsg(msgId, cancelSending);
  }

  async function handleDeliveryMessagesProgress(
    { id, progress }:
    { id: string; progress: web3n.asmail.DeliveryProgress }
  ) {
    if (!progress || progress?.localMeta?.chatId) {
      return;
    }

    updateListOfSendingMessage(id, progress);

    if (progress.allDone) {
      const allDoneValue = progress.allDone;
      let message = getMessage(id);
      if (!message) {
        await removeMessageFromDeliveryList(id, true);
        return;
      }

      if (allDoneValue === 'all-ok') {
        message = {
          ...message,
          mailFolder: SYSTEM_FOLDERS.sent,
          deliveryTS: Date.now(),
          status: 'sent',
        };
      } else if (allDoneValue === 'with-errors') {
        const statusDescription = Object.keys(progress.recipients || []).reduce((res, address) => {
          const recipientInfo = get(progress, ['recipients', address]);
          if (recipientInfo.err) {
            const errorFlag = handleSendingError(recipientInfo);
            errorFlag !== null && (res[address] = errorFlag || '');
          }

          return res;
        }, {} as Record<string, string>);

        message = {
          ...message,
          mailFolder: size(statusDescription) === size(message?.recipients)
            ? SYSTEM_FOLDERS.outbox
            : SYSTEM_FOLDERS.sent,
          status: 'error',
          statusDescription,
        };
      }

      await upsertMessage(message);
      if (message.mailFolder !== SYSTEM_FOLDERS.outbox) {
        messagesStore.$emitter.emit('sending-complete', { id, status: message.status === 'sent' ? 'ok' : 'error' });
      }

      await removeMessageFromDeliveryList(id);
      deleteFromListOfSendingMessage(id);
    }
  }

  async function initializeDeliveryService() {
    const sendingList = await w3n.mail?.delivery.listMsgs();
    if (!isEmpty(sendingList)) {
      listOfSendingMessage.value = (sendingList || []).reduce(
        (res, item) => {
          const { info } = item;
          const { localMeta } = info;
          if (!localMeta?.chatId) {
            res[item.id] = item.info;
          }

          return res;
        },
        {} as Record<string, web3n.asmail.DeliveryProgress>,
      );
    }

    w3n.mail?.delivery.observeAllDeliveries({
      next: async ({ id, progress }) => {
        await process.start(id, async () => {
          await handleDeliveryMessagesProgress({ id, progress });
        });
      },

      error: async (err: web3n.asmail.ASMailSendException) => {
        await w3n.log('error', 'Error while the message send.', err);
        // if ('msgCanceled' in err) {
        //   cancelSendMessage()
        // }
      },
    });

    console.info('# The sending service has initialized #');
  }

  return {
    listOfSendingMessage,
    initializeDeliveryService,
    updateListOfSendingMessage,
    deleteFromListOfSendingMessage,
    sendMessage,
    cancelSendMessage,
    removeMessageFromDeliveryList,
  };
});
