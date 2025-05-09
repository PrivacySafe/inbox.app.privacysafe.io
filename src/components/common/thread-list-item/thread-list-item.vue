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
  import size from 'lodash/size';
  import type { MessageThread } from '@/types';
  import ThreadListItemSingle from './thread-list-item-single.vue';
  import ThreadListItemMultiple from './thread-list-item-multiple.vue';

  withDefaults(defineProps<{
    item: MessageThread;
    folder: string;
    markedMessages?: string[];
  }>(), {
    markedMessages: () => [],
  });
  const emits = defineEmits<{
    (event: 'mark', value: string): void;
    (event: 'set-marks', value: string[]): void;
  }>();
</script>

<template>
  <div :class="$style.threadListItem">
    <thread-list-item-single
      v-if="size(item.messages) === 1"
      :item="item"
      :marked-messages="markedMessages"
      @mark="emits('mark', $event)"
    />

    <thread-list-item-multiple
      v-else
      :item="item"
      :folder="folder"
      :marked-messages="markedMessages"
      @mark="emits('mark', $event)"
      @set-marks="emits('set-marks', $event)"
    />
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/mixins' as mixins;

  .threadListItem {
    position: relative;
    width: 100%;
    min-height: 60px;
    background-color: var(--color-bg-block-primary-default);
    cursor: pointer;
  }
</style>
