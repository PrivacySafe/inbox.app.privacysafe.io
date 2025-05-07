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
  import { computed, type ComputedRef, inject, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import type { Nullable } from '@v1nt1248/3nclient-lib';
  import { useMessagesStore } from '@/store/messages.store';
  import type { MessageThread } from '@/types';
  import { FOLDER_KEY_BY_ID } from '@/components/common/message-list/constants';
  import ThreadListItem from '@/components/common/thread-list-item/thread-list-item.vue';

  const messagesStore = useMessagesStore();
  const { messageThreadsByFolder } = storeToRefs(messagesStore);

  const props = withDefaults(defineProps<{
    folder: string;
    selectedThreadId?: Nullable<string>;
    selectedMessageId?: Nullable<string>;
    markedMessages?: string[];
  }>(), {
    selectedThreadId: null,
    selectedMessageId: null,
    markedMessages: () => [],
  });
  const emits = defineEmits<{
    (event: 'select:thread', value: Nullable<string>): void;
    (event: 'select:message', value: Nullable<string>): void;
    (event: 'mark', value: string): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const folderEmptyText = computed(() => {
    const folderKey = FOLDER_KEY_BY_ID[props.folder];
    return folderKey ? $tr(`folder.empty.text.${folderKey}`) : '';
  });

  const threads = computed(() => get(messageThreadsByFolder.value, props.folder, [])) as ComputedRef<MessageThread[]>;

  watch(
    threads,
    () => {
      const currentThreadIndex = threads.value.findIndex(tr => tr.threadId === props.selectedThreadId);

      if (!props.selectedThreadId || currentThreadIndex === -1) {
        emits('select:message', null);
        emits('select:thread', null);
      }
    },
  );
</script>

<template>
  <div :class="$style.threadList">
    <div
      v-if="isEmpty(threads)"
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
      <thread-list-item
        v-for="thread in threads"
        :key="thread.threadId"
        :item="thread"
        :folder="folder"
        :selected-thread-id="selectedThreadId || null"
        :selected-message-id="selectedMessageId || null"
        :marked-messages="markedMessages"
        @select:thread="emits('select:thread', $event)"
        @select:message="emits('select:message', $event)"
        @mark="emits('mark', $event)"
      />
    </template>
  </div>
</template>

<style lang="scss" module>
  .threadList {
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
