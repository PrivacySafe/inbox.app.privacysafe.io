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
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Squire from 'squire-rte';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import { useContactsStore } from '@common/store';
import { useCreateMsgActions } from '@common/composables/useCreateMsgActions';
import type { AttachmentInfo, ContactListItem, PreparedMessageData } from '@common/types';
import type { CreateMsgDialogEmits, CreateMsgDialogProps } from './types';

export function useCreateMsg({
  props,
  emits,
  readonly,
  isMobileMode,
}: {
  props: Omit<CreateMsgDialogProps, 'dialogProps'>;
  emits?: CreateMsgDialogEmits;
  readonly?: boolean;
  isMobileMode?: boolean;
}) {
  const { t } = useI18n();

  const { getContactList } = useContactsStore();
  const { saveMsgToDraft, openSendMessageUI, runMessageSending } = useCreateMsgActions();

  const isLoading = ref(false);
  const dialogEl = ref<Nullable<HTMLDivElement>>(null);
  const contactList = ref<ContactListItem[]>([]);
  const msgData = ref<PreparedMessageData>({
    id: props.data?.id || getRandomId(32),
    threadId: props.data?.threadId || getRandomId(32),
    recipients: cloneDeep(props.data?.recipients || []),
    subject: props.data?.subject || '',
    attachmentsInfo: props.data?.attachmentsInfo || [],
    htmlTxtBody: props.data?.htmlTxtBody || '',
    plainTxtBody: '',
  });
  const withoutSave = ref(false);

  saveDraftMessage();

  const showEditorToolbar = ref(false);
  let textEditor: Nullable<Squire> = null;

  const isFormDisabled = computed(() => isEmpty(msgData.value.recipients));

  function filterContactList(value: ContactListItem, query: string): boolean {
    const { name, mail } = value;
    return (
      (name || '').toLowerCase().includes(query.toLowerCase()) || mail.toLowerCase().includes(query.toLowerCase())
    );
  }

  function getDisplayItem(item: ContactListItem) {
    const { name, mail } = item;
    return name ? `${name} (${mail})` : mail;
  }

  async function saveDraftMessage() {
    if (readonly) return;

    const msgId = await saveMsgToDraft(msgData.value);
    if (msgData.value.id !== msgId) {
      msgData.value.id = msgId;
    }
  }

  async function onMsgDataUpdate() {
    if (isMobileMode && emits) {
      emits('action', { event: 'update', data: { msgData: msgData.value } });
    }
    await saveDraftMessage();
  }

  const onMsgDataUpdateDebounced = debounce(onMsgDataUpdate, 1000);

  async function removeRecipient(recipient: string) {
    const currentRecipientIndex = msgData.value.recipients.findIndex(r => r === recipient);

    if (currentRecipientIndex === -1) return;

    msgData.value.recipients.splice(currentRecipientIndex, 1);
    await onMsgDataUpdateDebounced();
  }

  function onEditorInit(value: Squire) {
    textEditor = value;

    if (props.isThisReplyOrForward) {
      textEditor?.moveCursorToStart();
    } else {
      textEditor.moveCursorToEnd();
    }
  }

  function toggleEditorToolbarDisplaying() {
    showEditorToolbar.value = !showEditorToolbar.value;
  }

  async function msgBodyUpdate(value: string) {
    msgData.value.htmlTxtBody = value;
    await onMsgDataUpdateDebounced();
  }

  async function updateAttachments(val: AttachmentInfo[]) {
    msgData.value.attachmentsInfo = val;
    await onMsgDataUpdateDebounced();
  }

  async function discardMsg() {
    emits &&
      emits('action', { event: 'cancel', data: { msgData: msgData.value, withoutSave: withoutSave.value } });
  }

  async function sendMsg() {
    emits && emits('action', { event: 'send', data: { msgData: msgData.value, withoutSave: true } });
    await runMessageSending(msgData.value);
  }

  async function send() {
    const unavailableRecipients = await openSendMessageUI(msgData.value, t);
    const availableRecipients = !unavailableRecipients
      ? []
      : msgData.value.recipients.filter(address => !unavailableRecipients[address]);

    if (isEmpty(availableRecipients)) return;

    msgData.value.recipients = availableRecipients;
    await sendMsg();
  }

  onBeforeMount(async () => {
    contactList.value = (await getContactList()) || [];
  });

  return {
    t,
    isLoading,
    dialogEl,
    textEditor,
    contactList,
    msgData,
    withoutSave,
    showEditorToolbar,
    isFormDisabled,
    filterContactList,
    getDisplayItem,
    onEditorInit,
    onMsgDataUpdate,
    onMsgDataUpdateDebounced,
    removeRecipient,
    toggleEditorToolbarDisplaying,
    msgBodyUpdate,
    updateAttachments,
    discardMsg,
    send,
  };
}
