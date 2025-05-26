import { computed, inject, onBeforeMount, provide, readonly, ref } from 'vue';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import {
  I18N_KEY,
  I18nPlugin,
  NOTIFICATIONS_KEY,
  NotificationsPlugin,
  VUEBUS_KEY,
  VueBusPlugin,
} from '@v1nt1248/3nclient-lib/plugins';
import type {
  AppGlobalEvents,
  IncomingMessageView,
  MessageAction,
  MessageBulkActions,
  OutgoingMessageView,
} from '@common/types';
import { useContactsStore, useMessagesStore } from '@common/store';
import { useCreateMsgActions } from '@common/composables/useCreateMsgActions';
import { msgViewToPreparedMsgData } from '@common/utils';
import { SYSTEM_FOLDERS, MARKED_MESSAGES_INJECTION_KEY } from '@common/constants';

export function useFolderContent() {
  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const $notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;

  const { getContactList } = useContactsStore();
  const messagesStore = useMessagesStore();
  const { moveToTrash, deleteMessagesUi, bulkMoveToTrash, bulkRestore, upsertMessage } = messagesStore;
  const { openSendMessageUI, runMessageSending, prepareReplyMsgBody, prepareForwardMsgBody } = useCreateMsgActions();

  const markedMessages = ref<string[]>([]);

  const numberOfMarkedMessages = computed(() => size(markedMessages.value));
  const selectedMessageId = computed(() => (numberOfMarkedMessages.value === 1 ? markedMessages.value[0] : null));

  function markMessage(msgId: string) {
    const index = markedMessages.value.findIndex(id => id === msgId);
    if (index === -1) {
      markedMessages.value.push(msgId);
    } else {
      markedMessages.value.splice(index, 1);
    }
  }

  function setMarkedMessages(value: string[]) {
    markedMessages.value = value;
  }

  function resetMarkMessages() {
    markedMessages.value = [];
  }

  async function handleMessageAction({
    action,
    message,
    sourceFolder,
  }: {
    action: MessageAction;
    message: IncomingMessageView | OutgoingMessageView;
    sourceFolder?: string;
  }) {
    switch (action) {
      case 'edit':
        resetMarkMessages();
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
        resetMarkMessages();
        await moveToTrash(message);
        break;
      case 'delete': {
        const res = await deleteMessagesUi([message.msgId!], true);
        if (res) {
          resetMarkMessages();
        }
        break;
      }
      case 'send': {
        resetMarkMessages();
        const sendingMessageData = {
          ...msgViewToPreparedMsgData(message),
          status: 'sending',
        };
        const res = await openSendMessageUI(sendingMessageData, $tr);
        const availableRecipients =
          res === null ? [] : sendingMessageData.recipients.filter(address => !(res as string[]).includes(address));

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
        $bus.$emitter.emit('run-create-message', { data: replyMsgData, isThisReplyOrForward: true, sourceFolder });
        break;
      }
      case 'reply-all': {
        const replyMsgData = prepareReplyMsgBody(message as IncomingMessageView, $tr, true);
        $bus.$emitter.emit('run-create-message', { data: replyMsgData, isThisReplyOrForward: true, sourceFolder });
        break;
      }
      case 'forward': {
        const forwardMsgData = prepareForwardMsgBody(message, $tr);
        $bus.$emitter.emit('run-create-message', { data: forwardMsgData, isThisReplyOrForward: true, sourceFolder });
        break;
      }
      case 'restore': {
        const isMessageIncoming = !!(message as IncomingMessageView).sender;
        const isMessageDraft = !isMessageIncoming && message.status === 'draft';

        const updatedMessage = {
          ...message,
          mailFolder: isMessageIncoming
            ? SYSTEM_FOLDERS.inbox
            : isMessageDraft
              ? SYSTEM_FOLDERS.draft
              : SYSTEM_FOLDERS.sent,
        };

        resetMarkMessages();
        await upsertMessage(updatedMessage);
        break;
      }
      case 'mark-as-read':
        await upsertMessage({
          ...message,
          status: 'read',
        });
        break;
    }
  }

  async function handleMessageBulkActions({
    action,
    messageIds,
  }: {
    action: MessageBulkActions;
    messageIds: string[];
  }) {
    switch (action) {
      case 'cancel':
        resetMarkMessages();
        break;
      case 'move-to-trash': {
        resetMarkMessages();
        await bulkMoveToTrash(messageIds);
        break;
      }
      case 'delete': {
        const res = await deleteMessagesUi(messageIds, true);
        if (res) {
          resetMarkMessages();
        }
        break;
      }
      case 'restore': {
        resetMarkMessages();
        await bulkRestore(messageIds);
        break;
      }
    }
  }

  provide(MARKED_MESSAGES_INJECTION_KEY, {
    markedMessages: readonly(markedMessages),
    markMessage,
    setMarkedMessages,
    resetMarkMessages,
  });

  onBeforeMount(async () => {
    await getContactList();
  });

  return {
    markedMessages,
    selectedMessageId,
    markMessage,
    setMarkedMessages,
    resetMarkMessages,
    handleMessageAction,
    handleMessageBulkActions,
  };
}
