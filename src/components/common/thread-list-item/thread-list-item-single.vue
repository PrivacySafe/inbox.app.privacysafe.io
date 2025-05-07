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
  import type { Nullable } from '@v1nt1248/3nclient-lib';
  import type { MessageThread } from '@/types';
  import MessageListItem from '@/components/common/message-list-item/message-list-item.vue';

  const props = withDefaults(defineProps<{
    item: MessageThread;
    selectedThreadId: Nullable<string>;
    selectedMessageId: Nullable<string>;
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

  function selectItem() {
    emits('select:thread', props.item.threadId);
    emits('select:message', props.item.messages[0].msgId);
  }
</script>

<template>
  <message-list-item
    :item="item.messages[0]"
    :selected-item-id="selectedMessageId"
    :marked-messages="markedMessages"
    @select="selectItem"
    @mark="emits('mark', $event)"
  />
</template>
