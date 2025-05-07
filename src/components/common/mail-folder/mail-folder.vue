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
  import { useFolderContent } from '@/composables/useFolderContent';
  import ThreadList from '@/components/common/thread-list/thread-list.vue';
  import Thread from '@/components/common/thread/thread.vue';

  defineProps<{
    folder: string;
  }>();

  const {
    selectedMessageId,
    markedMessages,
    markMessage,
    handleMessageAction,
  } = useFolderContent();
</script>

<template>
  <div :class="$style.folder">
    <div :class="$style.list">
      <thread-list
        :folder="folder"
        :selected-thread-id="selectedThreadId"
        :selected-message-id="selectedMessageId"
        :marked-messages="markedMessages"
        @select:thread="selectThread"
        @select:message="selectMessage"
        @mark="markMessage"
      />
    </div>

    <div :class="$style.message">
      <thread
        :selected-thread-id="selectedThreadId"
        :selected-message-id="selectedMessageId"
        :is-bulk-actions-toolbar-open="isBulkActionsToolbarOpen"
        @action="handleMessageAction"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  .folder {
    --mail-list-width: calc(var(--column-size) * 4);

    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
  }

  .list {
    position: relative;
    width: var(--mail-list-width);
  }

  .message {
    position: relative;
    width: calc(100% - var(--mail-list-width));
    background-color: var(--color-bg-chat-bubble-general-bg);
  }
</style>
