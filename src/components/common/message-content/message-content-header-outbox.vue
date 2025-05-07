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
  import { computed, inject } from 'vue';
  import isEmpty from 'lodash/isEmpty';
  import get from 'lodash/get';
  import size from 'lodash/size';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { formatFileSize } from '@v1nt1248/3nclient-lib/utils';
  import { Ui3nButton, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useMessagesStore, useSendingStore } from '@/store';
  import { getMessageStatusUiData } from '@/utils';
  import type { IncomingMessageView, MessageAction, OutgoingMessageView } from '@/types';
  import { storeToRefs } from 'pinia';

  const props = defineProps<{
    message: OutgoingMessageView;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const { upsertMessage } = useMessagesStore();
  const sendingStore = useSendingStore();
  const { listOfSendingMessage } = storeToRefs(sendingStore);
  const { cancelSendMessage } = sendingStore;

  const isSendingStopped = computed(() => ['error', 'canceled'].includes(props.message?.status));

  const actionBtnTitle = computed(() => isSendingStopped.value
    ? $tr('msg.content.tooltip.resend')
    : $tr('msg.content.tooltip.cancel-sending'));

  const status = computed(() => getMessageStatusUiData({ message: props.message, $tr }));

  const messageProgress = computed(() => get(listOfSendingMessage.value, props.message.msgId!, null));

  const errorStateDescription = computed(() => {
    if (!isEmpty(props.message.statusDescription)) {
      return props.message.statusDescription?.join('. ');
    }

    return $tr('msg.sending.error.noDescription');
  });

  const totalMsgDataSize = computed(() => {
    if (!messageProgress.value) return 0;

    const { msgSize, recipients } = messageProgress.value!;
    return msgSize * size(recipients);
  });

  const sentDataSize = computed(() => {
    if (!messageProgress.value) return 0;

    const { recipients } = messageProgress.value!;
    return Object.keys(recipients).reduce((res, address) => {
      const { bytesSent = 0 } = recipients[address];
      res += bytesSent;
      return res;
    }, 0);
  });

  const progressText = computed(() => {
    const current = totalMsgDataSize.value == 0
      ? '0'
      : (sentDataSize.value / totalMsgDataSize.value * 100).toFixed(1);
    return $tr('msg.sending.process.text', {
      percent: `${current}%`,
      currentValue: formatFileSize(sentDataSize.value),
      totalValue: formatFileSize(totalMsgDataSize.value),
    });
  });

  async function resend() {
    emits('action', { action: 'send', message: props.message });
  }

  async function cancel() {
    await upsertMessage({
      ...props.message,
      status: 'canceled',
    });
    await cancelSendMessage(props.message.msgId!);
  }
</script>

<template>
  <div :class="$style.headerOutbox">
    <ui3n-tooltip :content="actionBtnTitle" position-strategy="fixed" placement="top-start">
      <ui3n-button
        type="secondary"
        :icon="isSendingStopped ? 'round-refresh' : 'cancel'"
        icon-color="var(--color-icon-button-secondary-default)"
        icon-position="left"
        :class="$style.btn"
        @click.stop.prevent="isSendingStopped ? resend() : cancel()"
      >
        {{ actionBtnTitle }}
      </ui3n-button>
    </ui3n-tooltip>

    <div :class="$style.info">
      <div :class="$style.progress">
        <ui3n-tooltip
          v-if="isSendingStopped"
          :content="errorStateDescription"
          position-strategy="fixed"
          placement="top-start"
        >
          <span v-if="isSendingStopped">{{ errorStateDescription }}</span>
        </ui3n-tooltip>

        <span v-else>{{ progressText }}</span>
      </div>

      <div :class="$style.status" :style="{ color: status?.color }">
        <span>{{ status?.text }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins.scss' as mixins;

  .headerOutbox {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    padding-left: var(--spacing-s);
  }

  .btn {
    --ui3n-button-bg-color-custom: var(--color-bg-block-primary-default) !important;
  }

  .info {
    position: relative;
    width: calc(100% - var(--spacing-xl));
    max-width: calc(100% - var(--spacing-xl));
    font-size: var(--font-12);
    line-height: var(--font-16);
    overflow: hidden;
  }

  .progress,
  .status {
    position: relative;
    width: 100%;
    height: var(--spacing-m);

    span {
      display: block;
      @include mixins.text-overflow-ellipsis();
    }
  }

  .progress {
    font-weight: 400;
    color: var(--color-text-chat-bubble-other-default);
  }

  .status {
    font-weight: 600;
  }
</style>
