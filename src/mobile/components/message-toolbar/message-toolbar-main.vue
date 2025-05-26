<script lang="ts" setup>
  import { computed } from 'vue';
  import size from 'lodash/size';
  import { Ui3nButton } from '@v1nt1248/3nclient-lib';
  import type { IncomingMessageView, MessageAction, OutgoingMessageView } from '@common/types';
  import { SYSTEM_FOLDERS } from '@common/constants';

  const props = defineProps<{
    message: OutgoingMessageView;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: MessageAction): void;
  }>();

  const isMessageIncoming = computed(() => !!(props.message as IncomingMessageView).sender);
  const isReplyBtnShow = computed(() => isMessageIncoming.value);
  const isReplyAllBtnShow = computed(() => isMessageIncoming.value && size(props.message.recipients) > 1);
  const isRestoreBtnShow = computed(() => props.message?.mailFolder === SYSTEM_FOLDERS.trash);
  const isMoveToTrashBtnShow = computed(() => props.message?.mailFolder !== SYSTEM_FOLDERS.trash);
</script>

<template>
  <div :class="$style.toolbarMain">
    <ui3n-button
      v-if="isReplyBtnShow"
      v-touch="() => emits('action', 'reply')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="reply-outline"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
    />

    <ui3n-button
      v-if="isReplyAllBtnShow"
      v-touch="() => emits('action', 'reply-all')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="reply-all-outline"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
    />

    <ui3n-button
      v-touch="() => emits('action', 'forward')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="forward-outline"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
    />

    <ui3n-button
      v-if="isRestoreBtnShow"
      v-touch="() => emits('action', 'restore')"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="round-refresh"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
    />

    <ui3n-button
      v-if="isMoveToTrashBtnShow"
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
  .toolbarMain {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-xs);
  }
</style>
