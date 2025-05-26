<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import { storeToRefs } from 'pinia';
  import get from 'lodash/get';
  import size from 'lodash/size';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { formatFileSize } from '@v1nt1248/3nclient-lib/utils';
  import { Ui3nButton } from '@v1nt1248/3nclient-lib';
  import { useSendingStore } from '@common/store';
  import type { MessageAction, OutgoingMessageView } from '@common/types';
  import { getMessageStatusUiData } from '@common/utils';

  const props = defineProps<{
    message: OutgoingMessageView;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: MessageAction): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const sendingStore = useSendingStore();
  const { listOfSendingMessage } = storeToRefs(sendingStore);

  const isSendingStopped = computed(() => ['error', 'canceled'].includes(props.message?.status));

  const status = computed(() => getMessageStatusUiData({ message: props.message, $tr }));

  const messageProgress = computed(() => get(listOfSendingMessage.value, props.message.msgId!, null));

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
</script>

<template>
  <div :class="$style.toolbarOutbox">
    <ui3n-button
      v-touch="() => emits('action', isSendingStopped ? 'send' : 'cancel')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      :icon="isSendingStopped ? 'round-refresh' : 'cancel'"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
    />

    <div :class="$style.info">
      <div :class="$style.progress">
        <span>{{ progressText }}</span>
      </div>

      <div
        :class="$style.status"
        :style="{ color: status?.color }"
      >
        <span>{{ status?.text }}</span>
      </div>
    </div>

    <ui3n-button
      v-touch="() => emits('action', 'move-to-trash')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="trash-can"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
    />

    <ui3n-button
      v-touch="() => emits('action', 'delete')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="outline-delete"
      icon-color="var(--warning-content-default)"
      icon-size="20"
    />
  </div>
</template>

<style lang="scss" module>
  @use '@common/assets/styles/_mixins' as mixins;

  .toolbarOutbox {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-xs);
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
    flex-grow: 1;
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
