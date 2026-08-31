import { computed, inject, onBeforeMount, onBeforeUnmount, provide, readonly, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import { NOTIFICATIONS_KEY, NotificationsPlugin, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
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
import { MARKED_MESSAGES_INJECTION_KEY } from '@common/constants';

export function useFolderContent() {
  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { t } = useI18n();
  const $notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;

  const { getContactList } = useContactsStore();
  const messagesStore = useMessagesStore();
  const { moveToTrash, deleteMessagesUi, bulkMoveToTrash, bulkRestore, upsertMessage } = messagesStore;
  const { openSendMessageUI, runMessageSending, prepareReplyMsgBody, prepareForwardMsgBody } =
    useCreateMsgActions();

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
      case 'edit': {
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
      }

      case 'move-to-trash': {
        resetMarkMessages();
        await moveToTrash(message);
        break;
      }

      case 'delete': {
        const res = await deleteMessagesUi([message.msgId!]);
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
        const unavailableRecipients = await openSendMessageUI(sendingMessageData, t);

        const availableRecipients = isEmpty(unavailableRecipients)
          ? sendingMessageData.recipients
          : sendingMessageData.recipients.filter(address => !unavailableRecipients[address]);

        if (isEmpty(availableRecipients)) {
          $notifications.$createNotice({
            type: 'error',
            content: t('msg.content.preflight_error'),
            duration: 4000,
          });
          return;
        }

        sendingMessageData.recipients = availableRecipients;
        await runMessageSending(sendingMessageData);
        break;
      }

      case 'reply': {
        const replyMsgData = prepareReplyMsgBody(message as IncomingMessageView, t);
        $bus.$emitter.emit('run-create-message', { data: replyMsgData, isThisReplyOrForward: true, sourceFolder });
        break;
      }

      case 'reply-all': {
        const replyMsgData = prepareReplyMsgBody(message as IncomingMessageView, t, true);
        $bus.$emitter.emit('run-create-message', { data: replyMsgData, isThisReplyOrForward: true, sourceFolder });
        break;
      }

      case 'forward': {
        const forwardMsgData = prepareForwardMsgBody(message, t);
        $bus.$emitter.emit('run-create-message', {
          data: forwardMsgData,
          isThisReplyOrForward: true,
          sourceFolder,
        });
        break;
      }

      case 'restore': {
        // Which folder a restored message belongs in is worked out by the
        // service, from homeFolderOf(). A copy of that rule here would diverge
        // from it on the first message whose sending failed - and the two
        // devices with it.
        resetMarkMessages();
        await bulkRestore([message.msgId]);
        break;
      }

      case 'mark-as-read': {
        await upsertMessage({
          ...message,
          status: 'read',
        });
        break;
      }

      // no default
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
        const res = await deleteMessagesUi(messageIds);
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

  function onMsgSendingComplete({ id }: { id: string; status: 'ok' | 'error' }) {
    if (markedMessages.value.includes(id)) {
      markMessage(id);
    }
  }

  provide(MARKED_MESSAGES_INJECTION_KEY, {
    markedMessages: readonly(markedMessages),
    markMessage,
    setMarkedMessages,
    resetMarkMessages,
  });

  function onOpenInboxMsg({ msgId }: { msgId: string }) {
    setMarkedMessages([msgId]);
  }

  onBeforeMount(async () => {
    await getContactList();

    $bus.$emitter.on('sending-complete', onMsgSendingComplete);
    $bus.$emitter.on('open-inbox-msg', onOpenInboxMsg);
  });

  onBeforeUnmount(() => {
    $bus.$emitter.off('sending-complete', onMsgSendingComplete);
    $bus.$emitter.off('open-inbox-msg', onOpenInboxMsg);
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
