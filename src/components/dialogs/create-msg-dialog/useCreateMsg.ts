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
import { computed, inject, onBeforeUnmount, onBeforeMount, ref } from 'vue';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import { useContactsStore } from '@/store';
import { useCreateMsgActions } from '@/composables/useCreateMsgActions';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { AttachmentInfo, ContactListItem, PreparedMessageData } from '@/types';
import type { CreateMsgDialogEmits, CreateMsgDialogProps } from './types';
import Squire from 'squire-rte';

export function useCreateMsg(props: CreateMsgDialogProps, emits: CreateMsgDialogEmits) {
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

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

  emits('select', { msgData: msgData.value });

  let timerId: number | undefined;

  const showEditorToolbar = ref(false);
  let textEditor: Nullable<Squire> = null;

  const isFormDisabled = computed(() => isEmpty(msgData.value.recipients));

  function filterContactList(value: ContactListItem, query: string): boolean {
    const { name, mail } = value;
    return (name || '').toLowerCase().includes(query.toLowerCase()) || mail.toLowerCase().includes(query.toLowerCase());
  }

  function getDisplayItem(item: ContactListItem) {
    const { name, mail } = item;
    return name ? `${name} (${mail})` : mail;
  }

  function onMsgDataUpdate() {
    emits('select', { msgData: msgData.value });
  }

  function removeRecipient(recipient: string) {
    const currentRecipientIndex = msgData.value.recipients.findIndex(r => r === recipient);

    if (currentRecipientIndex === -1) return;

    msgData.value.recipients.splice(currentRecipientIndex, 1);
    emits('select', { msgData: msgData.value });
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

  function msgBodyUpdate(value: string) {
    msgData.value.htmlTxtBody = value;

    emits('select', { msgData: msgData.value });
  }

  function updateAttachments(val: AttachmentInfo[]) {
    msgData.value.attachmentsInfo = val;
    emits('select', { msgData: msgData.value });
  }

  async function discardMsg() {
    emits('select', { msgData: msgData.value });
    emits('cancel');
  }

  async function sendMsg() {
    timerId && clearTimeout(timerId);
    emits('select', { msgData: msgData.value, withoutSave: true });
    await runMessageSending(msgData.value);
    emits('close');
  }

  async function send() {
    const res = await openSendMessageUI(msgData.value, $tr);
    const availableRecipients = res === null
      ? []
      : msgData.value.recipients.filter(address => !(res as string[]).includes(address));

    if (isEmpty(availableRecipients)) return;

    msgData.value.recipients = availableRecipients;
    await sendMsg();
  }

  onBeforeMount(async () => {
    contactList.value = (await getContactList()) || [];

    // @ts-ignore
    timerId = setInterval(async () => {
      const msgId = await saveMsgToDraft(msgData.value);
      if (msgData.value.id !== msgId) {
        msgData.value.id = msgId;
      }
    }, 10000);
  });

  onBeforeUnmount(() => {
    timerId && clearInterval(timerId);
  });

  return {
    $tr,
    isLoading,
    dialogEl,
    textEditor,
    contactList,
    msgData,
    showEditorToolbar,
    isFormDisabled,
    filterContactList,
    getDisplayItem,
    onEditorInit,
    onMsgDataUpdate,
    removeRecipient,
    toggleEditorToolbarDisplaying,
    msgBodyUpdate,
    updateAttachments,
    discardMsg,
    send,
  };
}
