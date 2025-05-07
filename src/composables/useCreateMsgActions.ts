import { inject } from 'vue';
import dayjs from 'dayjs';
import { DialogsPlugin, DIALOGS_KEY } from '@v1nt1248/3nclient-lib/plugins';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import { useAppStore, useMessagesStore, useSendingStore } from '@/store';
import { preparedMsgDataToOutgoingMsgView, prepareErrorText } from '@/utils';
import { SYSTEM_FOLDERS } from '@/constants';
import type { IncomingMessageView, OutgoingMessageView, PreparedMessageData } from '@/types';
import PreFlightDialog from '@/components/dialogs/pre-flight-dialog/pre-flight-dialog.vue';

export function useCreateMsgActions() {
  const $dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;

  const appStore = useAppStore();
  const { sendMessage } = useSendingStore();
  const { upsertMessage } = useMessagesStore();

  async function saveMsgToDraft(msgData: PreparedMessageData): Promise<string> {
    const preparedMsgData = preparedMsgDataToOutgoingMsgView(msgData, SYSTEM_FOLDERS.draft, 'draft');
    await upsertMessage(preparedMsgData);
    return preparedMsgData.msgId!;
  }

  async function runPreFlightProcess(
    msgData: PreparedMessageData,
    $tr: (key: string, placeholders?: Record<string, string>) => string,
  ): Promise<{
    recipientsVerificationResult: Record<string, number | string | null>;
    unavailableRecipients: string[];
  }> {
    const attachmentsSize = (msgData.attachmentsInfo || []).reduce((acc, item) => {
      acc += item.size;
      return acc;
    }, 0);

    const recipientsVerificationResult = {} as Record<string, number | string | null>;
    for (const recipient of msgData.recipients) {
      try {
        recipientsVerificationResult[recipient] = await w3n.mail!.delivery.preFlight(recipient);
      } catch (err) {
        recipientsVerificationResult[recipient] = prepareErrorText({
          $tr,
          address: recipient,
          error: err as web3n.asmail.DeliveryException,
        });
      }
    }

    const unavailableRecipients = Object.keys(recipientsVerificationResult).reduce((res, address) => {
      const verificationResult = recipientsVerificationResult[address];
      if (typeof verificationResult === 'number' && verificationResult >= attachmentsSize) {
        return res;
      }

      res.push(address);
      return res;
    }, [] as string[]);

    return {
      recipientsVerificationResult,
      unavailableRecipients,
    };
  }

  async function runMessageSending(msgData: PreparedMessageData) {
    const preparedMsgData = preparedMsgDataToOutgoingMsgView(msgData, SYSTEM_FOLDERS.outbox, 'sending');
    await upsertMessage(preparedMsgData);
    await sendMessage(preparedMsgData);
    return;
  }

  async function openSendMessageUI(
    msgData: PreparedMessageData,
    $tr: (key: string, placeholders?: Record<string, string>) => string,
  ): Promise<string[] | null> {
    return new Promise(resolve => {
      $dialogs.$openDialog<typeof PreFlightDialog>({
        component: PreFlightDialog,
        componentProps: {
          msgData,
        },
        dialogProps: {
          title: $tr('msg.preflight.dialog.title'),
          icon: {
            icon: 'outline-info',
            color: 'var(--color-icon-block-accent-default)',
          },
          closeOnClickOverlay: false,
          closeOnEsc: false,
          confirmButtonText: $tr('msg.preflight.dialog.confirm.button'),
          onConfirm: async (unavailableRecipients = []) => {
            resolve(unavailableRecipients as string[]);
          },
          onClose: () => {
            resolve(null);
          },
          onCancel: () => {
            resolve(null);
          },
        }
      });
    });
  }

  function prepareReplyMsgBody(
    message: IncomingMessageView,
    $tr: (key: string, placeholders?: Record<string, string>) => string,
    replayForAll?: boolean,
  ) {
    const replyMsgBody = `
      <br/><br/>
      <div>---------- ${$tr('msg.reply.title')} ----------</div>
      <div>${dayjs(message.deliveryTS).format('YYYY-MM-DD HH:mm')}</div>
      <div>${$tr('msg.create.label.from')}: ${message.sender}</div>
      <div>${$tr('msg.create.label.to')}: ${message.recipients?.join(', ')}</div>
      <div>${$tr('msg.create.label.subject')}: ${message.subject}</div>
      <blockquote>${message.htmlTxtBody || ''}</blockquote>
    `;

    const initialRecipients = (message.recipients || []).filter(address => address !== appStore.user);
    const recipients = replayForAll
      ? [message.sender, ...initialRecipients]
      : [message.sender];

    return {
      id: getRandomId(32),
      threadId: message.threadId,
      recipients,
      subject: `Re: ${message.subject}`,
      attachmentsInfo: [],
      htmlTxtBody: replyMsgBody,
    }
  }

  function prepareForwardMsgBody(
    message: IncomingMessageView | OutgoingMessageView,
    $tr: (key: string, placeholders?: Record<string, string>) => string,
  ) {
    const forwardMsgBody = `
      <br/><br/>
      <div>---------- ${$tr('msg.forward.title')} ----------</div>
      <div>${message.deliveryTS ? dayjs(message.deliveryTS).format('YYYY-MM-DD HH:mm') : dayjs(message.cTime).format('YYYY-MM-DD HH:mm')}</div>
      <div>${$tr('msg.create.label.from')}: ${(message as IncomingMessageView).sender || appStore.user}</div>
      <div>${$tr('msg.create.label.to')}: ${message.recipients?.join(', ')}</div>
      <div>${$tr('msg.create.label.subject')}: ${message.subject}</div><br/>
      ${message.htmlTxtBody || ''}
    `;

    return {
      id: getRandomId(32),
      threadId: message.threadId,
      recipients: [],
      subject: `Fwd: ${message.subject}`,
      attachmentsInfo: message.attachmentsInfo || [],
      htmlTxtBody: forwardMsgBody,
    }
  }

  return {
    saveMsgToDraft,
    runPreFlightProcess,
    runMessageSending,
    openSendMessageUI,
    prepareReplyMsgBody,
    prepareForwardMsgBody,
  };
}
