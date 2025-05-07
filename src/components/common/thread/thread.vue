<script lang="ts" setup>
  import { computed, inject, ref, watchEffect, watch } from 'vue';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import type { Nullable } from '@v1nt1248/3nclient-lib';
  import { useMessagesStore } from '@/store/messages.store';
  import type { IncomingMessageView, MessageAction, OutgoingMessageView } from '@/types';
  import messageBgImg from '@/assets/images/message-bg.png';
  import MessageContent from '@/components/common/message-content/message-content.vue';

  const props = withDefaults(defineProps<{
    selectedThreadId?: Nullable<string>;
    selectedMessageId?: Nullable<string>;
    markedMessages?: string[];
    isBulkActionsToolbarOpen?: boolean;
  }>(), {
    selectedThreadId: null,
    selectedMessageId: null,
    markedMessages: () => [],
  });
  const emits = defineEmits<{
    (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const messagesStore = useMessagesStore();
  const { getMessagesByThread, getMessage } = messagesStore;

  const messages = ref<(IncomingMessageView | OutgoingMessageView)[]>([]);

  const isThreadEmpty = computed(() => isEmpty(messages.value!));

  function messageSort(
    a: IncomingMessageView | OutgoingMessageView,
    b: IncomingMessageView | OutgoingMessageView,
  ): number {
    const aTS = (a.deliveryTS || a.cTime) as number;
    const bTS = (b.deliveryTS || b.cTime) as number;
    return bTS > aTS ? 1 : -1;
  }

  watchEffect(() => {
    if (props.selectedMessageId) {
      const msg = getMessage(props.selectedMessageId);
      messages.value = msg ? [msg] : [];
    } else if (props.selectedThreadId) {
      messages.value = getMessagesByThread(props.selectedThreadId);
    } else {
      messages.value = [];
    }

    messages.value.sort(messageSort);
  });
</script>

<template>
  <div :class="$style.thread">
    <div
      v-if="isThreadEmpty"
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

    <div
      v-else
      :class="$style.threadBody"
    >
      <template
        v-for="message in messages"
        :key="message.msgId"
      >
        <message-content
          :qwe="123"
          :message="message"
          :class="$style.threadItem"
          @action="emits('action', $event)"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" module>
  .thread {
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

  .threadItem {
    margin-bottom: var(--spacing-xs);
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

  .threadBody {
    position: relative;
    width: 100%;
  }
</style>
