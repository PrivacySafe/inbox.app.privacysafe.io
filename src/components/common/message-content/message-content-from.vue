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
  import hasIn from 'lodash/hasIn';
  import get from 'lodash/get';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nChip, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useAppStore } from '@/store';
  import { ContactListItem, IncomingMessageView, OutgoingMessageView } from '@/types';
  import ContactIcon from '@/components/common/contact-icon.vue';

  const props = defineProps<{
    message: IncomingMessageView | OutgoingMessageView;
    contactList: ContactListItem[];
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const { user } = storeToRefs(useAppStore());

  const isIncomingMessage = computed(() => hasIn(props.message, 'sender'));
  const sender = computed(() => {
    if (!isIncomingMessage.value) {
      return 'Me';
    }

    const value = get(props.message, 'sender', '');

    if (!value.includes('@')) {
      return value;
    }

    const contact = props.contactList.find((c) => c.mail === value);
    return contact?.name || contact?.mail || (props.message as IncomingMessageView).sender;
  });
</script>

<template>
  <div :class="$style.msgFrom">
    <div :class="$style.label">
      {{ $tr('msg.create.label.from') }}:
    </div>

    <ui3n-tooltip
      :content="isIncomingMessage ? (message as IncomingMessageView).sender : user"
      position-strategy="fixed"
      placement="top-start"
    >
      <ui3n-chip
        height="32"
        max-width="100%"
      >
        <template #left>
          <contact-icon
            :size="24"
            :name="sender"
            readonly
          />
        </template>

        <span :class="$style.contact">
          {{ sender }}
        </span>
      </ui3n-chip>
    </ui3n-tooltip>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins.scss' as mixins;

  .msgFrom {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-xs);
  }

  .label {
    font-size: var(--font-14);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
  }

  .contact {
    display: block;
    font-size: var(--font-10);
    font-weight: 400;
    color: var(--color-text-control-primary-default);
    @include mixins.text-overflow-ellipsis();
  }
</style>
