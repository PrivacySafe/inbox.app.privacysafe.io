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
import { NamedProcs } from '@v1nt1248/3nclient-lib/utils';
import { outgoingMsgViewToOutgoingMsg } from '@common/utils';
import type { OutgoingMessageView } from '@common/types';

export const useSendingStore = defineStore('sending', () => {
  const process = new NamedProcs();

  const listOfSendingMessage = ref<Record<string, web3n.asmail.DeliveryProgress>>({});

  function updateListOfSendingMessage(id: string, progress: web3n.asmail.DeliveryProgress) {
    listOfSendingMessage.value[id] = progress;
  }

  function deleteFromListOfSendingMessage(id: string) {
    delete listOfSendingMessage.value[id];
  }

  async function initializeDeliveryService() {
    const sendingList = await w3n.mail?.delivery.listMsgs();
    if (!isEmpty(sendingList)) {
      listOfSendingMessage.value = (sendingList || []).reduce(
        (res, item) => {
          res[item.id] = item.info;
          return res;
        },
        {} as Record<string, web3n.asmail.DeliveryProgress>,
      );
    }

    w3n.mail?.delivery.observeAllDeliveries({
      next: ({ id, progress }) => {
        updateListOfSendingMessage(id, progress);
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
