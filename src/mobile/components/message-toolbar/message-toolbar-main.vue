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
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="reply-outline"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
      @click="emits('action', 'reply')"
    />

    <ui3n-button
      v-if="isReplyAllBtnShow"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="reply-all-outline"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
      @click="emits('action', 'reply-all')"
    />

    <ui3n-button
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="forward-outline"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
      @click="emits('action', 'forward')"
    />

    <ui3n-button
      v-if="isRestoreBtnShow"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="round-refresh"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
      @click="emits('action', 'restore')"
    />

    <ui3n-button
      v-if="isMoveToTrashBtnShow"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="trash-can"
      icon-color="var(--color-icon-block-primary-default)"
      icon-size="20"
      @click="emits('action', 'move-to-trash')"
    />

    <ui3n-button
      type="icon"
      color="var(--color-bg-block-primary-default)"
      icon="outline-delete"
      icon-color="var(--warning-content-default)"
      icon-size="20"
      @click="emits('action', 'delete')"
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
