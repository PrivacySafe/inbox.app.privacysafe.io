<script lang="ts" setup>
  import { computed, inject, ref, watchEffect } from 'vue';
  import size from 'lodash/size';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import type { Nullable } from '@v1nt1248/3nclient-lib';
  import { useMessagesStore } from '@/store';
  import messageBgImg from '@/assets/images/message-bg.png';
  import type { IncomingMessageView, OutgoingMessageView } from '@/types';
  import type { MessageProps, MessageEmits } from './types';
  import MessageBulkActionsToolbar
    from '@/components/common/message-bulk-actions-boolbar/message-bulk-actions-toolbar.vue';
  import MessageContent from '@/components/common/message-content/message-content.vue';

  const props = withDefaults(defineProps<MessageProps>(), {
    markedMessages: () => [],
  });
  const emits = defineEmits<MessageEmits>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const messagesStore = useMessagesStore();
  const { getMessage } = messagesStore;

  const message = ref<Nullable<IncomingMessageView | OutgoingMessageView>>();

  const isBulkActionsToolbarOpen = computed(() => size(props.markedMessages) >= 2);

  watchEffect(() => {
    if (props.messageId) {
      message.value = getMessage(props.messageId);
    } else {
      message.value = null;
    }
  });
</script>

<template>
  <div :class="$style.messageWrap">
    <div
      v-if="!message"
      :class="$style.empty"
    >
      <img
        :src="messageBgImg"
        alt="bgImg"
      >

      <div :class="$style.emptyText">
        <p>{{ $tr('msg.no.selected.part1') }}</p>
        <p>{{ $tr('msg.no.selected.part2') }}</p>
      </div>
    </div>

    <template v-else>
      <message-content
        :message="message"
        @action="emits('action', $event)"
      />
    </template>

    <div
      v-if="isBulkActionsToolbarOpen"
      :class="$style.bulkActions"
    >
      <message-bulk-actions-toolbar
        :marked-messages="markedMessages"
        @bulk-actions="emits('bulk-actions', $event)"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  .messageWrap {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: var(--spacing-s);
    background-color: var(--color-bg-chat-bubble-general-bg);
    overflow-y: auto;
  }

  .empty {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    row-gap: 72px;
  }

  .emptyText {
    position: relative;
    width: 180px;
    font-size: var(--font-14);
    font-weight: 400;
    line-height: var(--font-20);
    color: var(--color-text-block-primary-default);

    p {
      margin: 0;
      text-align: center;
    }
  }

  .bulkActions {
    position: absolute;
    width: 100%;
    height: var(--spacing-xxl);
    left: 0;
    top: 0;
  }
</style>
