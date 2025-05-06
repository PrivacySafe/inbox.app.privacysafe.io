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
  import hasIn from 'lodash/hasIn';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import type { IncomingMessageView, MessageAction, OutgoingMessageView } from '@/types';
  import { SYSTEM_FOLDERS } from '@/constants';

  const props = defineProps<{
    message: IncomingMessageView | OutgoingMessageView;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const isMessageIncoming = computed(() => hasIn(props.message, 'sender'));

  const isReplyBtnShow = computed(() => isMessageIncoming.value);
  const isRestoreBtnShow = computed(() => props.message?.mailFolder === SYSTEM_FOLDERS.trash);
</script>

<template>
  <div :class="$style.msgHeader">
    <ui3n-tooltip
      v-if="isReplyBtnShow"
      :content="$tr('msg.content.tooltip.reply')"
      position-strategy="fixed"
      placement="top-start"
    >
      <ui3n-button
        type="secondary"
        icon="reply-outline"
        icon-color="var(--color-icon-button-secondary-default)"
        icon-position="left"
        @click.stop.prevent="emits('action', { action: 'reply', message })"
      >
        {{ $tr('msg.content.tooltip.reply') }}
      </ui3n-button>
    </ui3n-tooltip>

    <ui3n-tooltip
      :content="$tr('msg.content.tooltip.forward')"
      position-strategy="fixed"
      placement="top-start"
    >
      <ui3n-button
        type="secondary"
        icon="forward-outline"
        icon-color="var(--color-icon-button-secondary-default)"
        icon-position="left"
        @click.stop.prevent="emits('action', { action: 'forward', message })"
      >
        {{ $tr('msg.content.tooltip.forward') }}
      </ui3n-button>
    </ui3n-tooltip>

    <ui3n-tooltip
      v-if="isRestoreBtnShow"
      :content="$tr('msg.content.tooltip.restore')"
      position-strategy="fixed"
      placement="top-start"
    >
      <ui3n-button
        type="secondary"
        icon="round-refresh"
        icon-color="var(--color-icon-button-secondary-default)"
        icon-position="left"
        @click.stop.prevent="emits('action', { action: 'restore', message })"
      >
        {{ $tr('msg.content.tooltip.restore') }}
      </ui3n-button>
    </ui3n-tooltip>
  </div>
</template>

<style lang="scss" module>
  .msgHeader {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    padding-left: var(--spacing-s);
  }
</style>
