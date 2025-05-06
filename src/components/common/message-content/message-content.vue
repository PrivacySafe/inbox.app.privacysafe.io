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
  import { computed, inject, onBeforeMount, ref, watch } from 'vue';
  import size from 'lodash/size';
  import hasIn from 'lodash/hasIn';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nIcon, Ui3nMenu, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useContactsStore, useMessagesStore } from '@/store';
  import { SYSTEM_FOLDERS } from '@/constants';
  import type { ContactListItem } from '@/types';
  import type { MessageContentProps, MessageContentEmits } from './types';
  import MessageContentHeader from './message-content-header.vue';
  import MessageContentHeaderOutbox from './message-content-header-outbox.vue';
  import MessageContentHeaderDraft from './message-content-header-draft.vue';
  import MessageContentSubject from './message-content-subject.vue';
  import MessageContentFrom from './message-content-from.vue';
  import MessageContentTo from './message-content-to.vue';
  import MessageContentAttachments from './message-content-attachments.vue';
  import TextEditor from '@/components/common/text-editor/text-editor.vue';

  const props = defineProps<MessageContentProps>();
  const emits = defineEmits<MessageContentEmits>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const { getContactList } = useContactsStore();
  const { upsertMessage } = useMessagesStore();

  const contactList = ref<ContactListItem[]>([]);

  const isMessageIncoming = computed(() => hasIn(props.message, 'sender'));

  onBeforeMount(async () => {
    contactList.value = (await getContactList()) || [];
  });

  watch(
    () => props.message.msgId,
    async (val, oVal) => {
      if (isMessageIncoming.value && val && val !== oVal && props.message.status !== 'read') {
        setTimeout(async () => {
          await upsertMessage({
            ...props.message,
            status: 'read',
          })
        }, 400);
      }
    }, {
      immediate: true,
    }
  );
</script>

<template>
  <div :class="$style.messageContent">
    <div :class="$style.header">
      <message-content-header-outbox
        v-if="message?.mailFolder === SYSTEM_FOLDERS.outbox"
        :message="message"
        @action="emits('action', $event)"
      />

      <message-content-header-draft
        v-else-if="message?.mailFolder === SYSTEM_FOLDERS.draft"
        :message="message"
        @action="emits('action', $event)"
      />

      <message-content-header
        v-else
        :message="message"
        @action="emits('action', $event)"
      />

      <div :class="$style.headerAction">
        <ui3n-menu
          position-strategy="fixed"
          :offset-y="4"
        >
          <ui3n-tooltip
            :content="$tr('msg.content.tooltip.delete')"
            placement="top-end"
            position-strategy="fixed"
          >
            <ui3n-button
              type="icon"
              icon="outline-delete"
              icon-color="var(--color-icon-button-secondary-default)"
              :class="$style.deleteBtn"
            />
          </ui3n-tooltip>

          <template #menu>
            <div :class="$style.menu">
              <div
                :class="[$style.menuItem, message.mailFolder === SYSTEM_FOLDERS.trash && $style.menuItemDisabled]"
                @click="emits('action', { action: 'move-to-trash', message: props.message })"
              >
                <ui3n-icon icon="trash-can" />
                <span>{{ $tr('msg.content.btn.moveToTrash') }}</span>
              </div>

              <div
                :class="[$style.menuItem, $style.accent]"
                @click="emits('action', { action: 'delete', message: props.message })"
              >
                <ui3n-icon
                  icon="outline-delete"
                  color="var(--warning-content-default)"
                />

                <span>{{ $tr('msg.content.btn.deleteForever') }}</span>
              </div>
            </div>
          </template>
        </ui3n-menu>
      </div>
    </div>

    <message-content-subject :message="message" />

    <div :class="$style.contacts">
      <message-content-from
        :message="message"
        :contact-list="contactList"
      />

      <message-content-to
        :message="message"
        :contact-list="contactList"
      />
    </div>

    <div
      v-if="size(message.attachmentsInfo)"
      :class="$style.attachments"
    >
      <message-content-attachments
        :message="message"
        :readonly="message?.mailFolder === SYSTEM_FOLDERS.outbox"
      />
    </div>

    <div :class="$style.messageBody">
      <text-editor
        v-if="message.htmlTxtBody"
        :text="message.htmlTxtBody"
        disabled
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/mixins' as mixins;

  .messageContent {
    position: relative;
    width: 100%;
    background-color: var(--color-bg-block-primary-default);
    border-radius: 12px;
  }

  .header {
    position: relative;
    width: 100%;
    height: var(--spacing-xl);
    padding-right: var(--spacing-xxl);
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }

  .headerAction {
    position: absolute;
    width: var(--spacing-l);
    height: var(--spacing-l);
    top: var(--spacing-xs);
    right: var(--spacing-m);
  }

  .deleteBtn {
    --ui3n-button-bg-color-custom: var(--color-bg-block-primary-default) !important;
  }

  .menu {
    position: relative;
    background-color: var(--color-bg-control-secondary-default);
    width: max-content;
    border-radius: var(--spacing-xs);
    @include mixins.elevation(1);
  }

  .menuItem {
    position: relative;
    width: max-content;
    height: var(--spacing-l);
    padding: 0 var(--spacing-s);
    font-size: var(--font-13);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    cursor: pointer;

    &.accent {
      color: var(--warning-content-default);
    }

    &.menuItemDisabled {
      cursor: default;
      pointer-events: none;
      opacity: 0.25;
    }

    &:hover {
      background-color: var(--color-bg-control-primary-hover);
      color: var(--color-text-control-accent-default);

      & > div {
        color: var(--color-text-control-accent-default) !important;
      }
    }
  }

  .contacts {
    position: relative;
    width: 100%;
    padding: 12px var(--spacing-m);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    row-gap: var(--spacing-s);
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }

  .attachments {
    position: relative;
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }

  .messageBody {
    position: relative;
    width: 100%;
    padding: var(--spacing-s);
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }
</style>
