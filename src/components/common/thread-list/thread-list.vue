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
  import { storeToRefs } from 'pinia';
  import get from 'lodash/get';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { useMessagesStore } from '@/store/messages.store';
  import type { MessageThread } from '@/types';
  import { FOLDER_KEY_BY_ID } from '@/components/common/message-list/constants';
  import ThreadListItem from '@/components/common/thread-list-item/thread-list-item.vue';
  import { SYSTEM_FOLDERS } from '@/constants';

  const messagesStore = useMessagesStore();
  const { messageThreadsByFolder, messageThreadsFromTrash } = storeToRefs(messagesStore);

  const props = withDefaults(defineProps<{
    folder: string;
    markedMessages?: string[];
  }>(), {
    markedMessages: () => [],
  });
  const emits = defineEmits<{
    (event: 'mark', value: string): void;
    (event: 'set-marks', value: string[]): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const folderEmptyText = computed(() => {
    const folderKey = FOLDER_KEY_BY_ID[props.folder];
    return folderKey ? $tr(`folder.empty.text.${folderKey}`) : '';
  });

  const threads = computed(() => {
    if (props.folder === SYSTEM_FOLDERS.trash) {
      return Object.values(messageThreadsFromTrash.value);
    }

    return get(messageThreadsByFolder.value, props.folder, []) as MessageThread[];
  });
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
        :marked-messages="markedMessages"
        @mark="emits('mark', $event)"
        @set-marks="emits('set-marks', $event)"
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
