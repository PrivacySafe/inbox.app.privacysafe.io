<script lang="ts" setup>
  import { computed, type ComputedRef, inject } from 'vue';
  import { storeToRefs } from 'pinia';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { useMessagesStore } from '@/store';
  import { FOLDER_KEY_BY_ID } from './constants';
  import type { IncomingMessageView, OutgoingMessageView } from '@/types';
  import type { MessageListProps, MessageListEmits } from './types';
  import MessageListItem from '@/components/common/message-list-item/message-list-item.vue';

  const props = withDefaults(defineProps<MessageListProps>(), {
    markedMessages: () => [],
  });
  const emits = defineEmits<MessageListEmits>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const { messagesByFolders } = storeToRefs(useMessagesStore());

  const folderEmptyText = computed(() => {
    const folderKey = FOLDER_KEY_BY_ID[props.folder];
    return folderKey ? $tr(`folder.empty.text.${folderKey}`) : '';
  });

  const messages = computed(() => get(messagesByFolders.value, [props.folder, 'data'], {})) as ComputedRef<Record<string, IncomingMessageView | OutgoingMessageView>>;
  const messagesList = computed(() => Object.values(messages.value).sort((a, b) => a.deliveryTS - b.deliveryTS));
</script>

<template>
  <div :class="$style.messageList">
    <div
      v-if="isEmpty(messages)"
      :class="$style.empty"
    >
      <div :class="$style.emptyTitle">
        {{ $tr('folder.empty.title') }}
      </div>
      <div
        v-if="folderEmptyText"
        :class="$style.emptyText"
      >
        {{ folderEmptyText }}
      </div>
    </div>

    <template v-else>
      <message-list-item
        v-for="item in messagesList"
        :key="item.msgId!"
        :item="item"
        :marked-messages="markedMessages"
        @mark="emits('mark', $event)"
      />
    </template>
  </div>
</template>

<style lang="scss" module>
  .messageList {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-block-primary-default);
    overflow-y: auto;
  }

  .empty {
    position: relative;
    width: 100%;
    font-size: var(--font-14);
    font-weight: 400;
    line-height: var(--font-20);
    padding: var(--spacing-m) var(--spacing-l);
  }

  .emptyTitle {
    text-align: center;
    color: var(--color-text-block-primary-default);
  }

  .emptyText {
    text-align: center;
    color: var(--color-text-block-secondary-default);
    margin-top: var(--spacing-m);
  }
</style>
