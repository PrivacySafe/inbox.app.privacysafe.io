<!--
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
-->
<script lang="ts" setup>
  import { inject, onBeforeMount, ref } from 'vue';
  import { useContactsStore, useMessagesStore } from '@/store';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import {
    I18N_KEY,
    I18nPlugin,
    NOTIFICATIONS_KEY,
    NotificationsPlugin,
    VUEBUS_KEY,
    VueBusPlugin,
  } from '@v1nt1248/3nclient-lib/plugins';
  import type { Nullable } from '@v1nt1248/3nclient-lib';
  import type { AppGlobalEvents, IncomingMessageView, MessageAction, OutgoingMessageView } from '@/types';
  import type { MailFolderContentProps } from './types';
  import { useCreateMsgActions } from '@/composables/useCreateMsgActions';
  import { outgoingMsgViewToPreparedMsgData } from '@/utils';
  import MessageList from '@/components/common/message-list/message-list.vue';
  import Message from '@/components/common/message/message.vue';
  import { SYSTEM_FOLDERS } from '@/constants';

  defineProps<MailFolderContentProps>();

  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const $notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;

  const { getContactList } = useContactsStore();
  const { getMessage, moveToTrash, deleteMessagesUi, upsertMessage } = useMessagesStore();
  const { openSendMessageUI, runMessageSending, prepareReplyMsgBody, prepareForwardMsgBody } = useCreateMsgActions();

  const selectedMessage = ref<Nullable<IncomingMessageView | OutgoingMessageView>>(null);

  function selectMessage(msgId: Nullable<string>) {
    selectedMessage.value = !msgId ? null : getMessage(msgId);
  }

  async function handleMessageAction({ action, message }: {
    action: MessageAction,
    message: IncomingMessageView | OutgoingMessageView
  }) {
    switch (action) {
      case 'edit':
        selectedMessage.value = null;
        $bus.$emitter.emit('run-create-message', {
          data: {
            id: get(message, 'msgId'),
            threadId: get(message, ['threadId']),
            recipients: get(message, 'recipients', []),
            subject: get(message, 'subject', ''),
            attachmentsInfo: get(message, 'attachmentsInfo', []),
            htmlTxtBody: get(message, ['htmlTxtBody']),
          },
        });
        break;
      case 'move-to-trash':
        selectedMessage.value = null;
        await moveToTrash(message);
        break;
      case 'delete': {
        const res = await deleteMessagesUi([message.msgId!], true);
        if (res) {
          selectedMessage.value = null;
        }
        break;
      }
      case 'send': {
        selectedMessage.value = null;
        const sendingMessageData = {
          ...outgoingMsgViewToPreparedMsgData(message),
          status: 'sending',
        };
        const res = await openSendMessageUI(sendingMessageData, $tr);
        const availableRecipients = res === null
          ? []
          : sendingMessageData.recipients.filter(address => !(res as string[]).includes(address));

        if (isEmpty(availableRecipients)) {
          $notifications.$createNotice({
            type: 'error',
            content: $tr('msg.content.header.preflight.error'),
          });
          return;
        }

        sendingMessageData.recipients = availableRecipients;
        await runMessageSending(sendingMessageData);
        break;
      }
      case 'reply': {
        const replyMsgData = prepareReplyMsgBody(message as IncomingMessageView, $tr);
        $bus.$emitter.emit('run-create-message', { data: replyMsgData, isThisReplyOrForward: true });
        break;
      }
      case 'forward': {
        const forwardMsgData = prepareForwardMsgBody(message, $tr);
        $bus.$emitter.emit('run-create-message', { data: forwardMsgData, isThisReplyOrForward: true });
        break;
      }
      case 'restore': {
        const isMessageIncoming = !!(message as IncomingMessageView).sender;
        const isMessageDraft = !isMessageIncoming && message.status === 'draft';

        const updatedMessage = {
          ...message,
          mailFolder: isMessageIncoming
            ? SYSTEM_FOLDERS.inbox
            : isMessageDraft ? SYSTEM_FOLDERS.draft : SYSTEM_FOLDERS.sent,
        };
        await upsertMessage(updatedMessage);
        break;
      }
    }
  }

  onBeforeMount(async () => {
    await getContactList();
  });
</script>

<template>
  <div :class="$style.folder">
    <div :class="$style.list">
      <message-list
        :folder="folder"
        :selected-message-id="selectedMessage?.msgId"
        @select="selectMessage"
      />
    </div>

    <div :class="$style.message">
      <message
        :message="selectedMessage"
        @action="handleMessageAction"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  .folder {
    --mail-list-width: calc(var(--column-size) * 4);

    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
  }

  .list {
    position: relative;
    width: var(--mail-list-width);
  }

  .message {
    position: relative;
    width: calc(100% - var(--mail-list-width));
    background-color: var(--color-bg-chat-bubble-general-bg);
  }
</style>
