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
  import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import size from 'lodash/size';
  import { I18N_KEY, I18nPlugin, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { type Nullable, Ui3nButton, Ui3nChip, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import type { AppGlobalEvents, ContactListItem, IncomingMessageView, OutgoingMessageView } from '@/types';
  import ContactIcon from '@/components/common/contact-icon.vue';

  const props = defineProps<{
    message: IncomingMessageView | OutgoingMessageView;
    contactList: ContactListItem[];
  }>();

  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const wrapperEl = ref<Nullable<HTMLDivElement>>(null);
  const bodyEl = ref<Nullable<HTMLDivElement>>(null);
  const isBlockOpen = ref(false);
  const isOverflowing = ref(true);
  const firstRowContactCount = ref(0);

  function initRecipientListDisplaying() {
    isBlockOpen.value = false;
    isOverflowing.value = true;
    firstRowContactCount.value = 0;

    setTimeout(() => {
      if (wrapperEl.value && bodyEl.value && !isBlockOpen.value) {
        isOverflowing.value = bodyEl.value.clientHeight > wrapperEl.value.clientHeight;

        if (isOverflowing.value) {
          if (isBlockOpen.value || !bodyEl.value || size(bodyEl.value?.children) === 0) {
            firstRowContactCount.value = 0;
          } else {
            const bodyElWidth = bodyEl.value.clientWidth;
            let startWidth = 0;

            firstRowContactCount.value = [...bodyEl.value.children].reduce((acc, el) => {
              startWidth += (el.clientWidth + 4);
              if (startWidth < bodyElWidth) {
                acc += 1;
              }

              return acc;
            }, 0);
          }
        }
      }
    }, 250);
  }

  function getContactDisplayName(mail: string): string {
    const contact = props.contactList.find(c => c.mail === mail);
    return contact ? contact.displayName : mail;
  }

  function extendRecipientsBlock() {
    isBlockOpen.value = true;
  }

  onMounted(() => {
    $bus.$emitter.on('resize-app', initRecipientListDisplaying);
  });

  onBeforeUnmount(() => {
    $bus.$emitter.off('resize-app', initRecipientListDisplaying);
  });

  watch(
    () => props.message.msgId,
    (val, oldVal) => {
      if (val !== oldVal) {
        initRecipientListDisplaying();
      }
    }, {
      immediate: true,
    }
  );
</script>

<template>
  <div :class="$style.msgTo">
    <div :class="$style.label">
      {{ $tr('msg.create.label.to') }}:
    </div>

    <div
      ref="wrapperEl"
      :class="[
        $style.recipients,
        isBlockOpen && $style.opened,
        isOverflowing && $style.overflowing
      ]"
    >
      <div ref="bodyEl" :class="$style.body">
        <template v-for="address in message.recipients" :key="address">
          <ui3n-tooltip
            :content="address"
            position-strategy="fixed"
            placement="top-start"
          >
            <ui3n-chip height="32" max-width="100%">
              <template #left>
                <contact-icon :size="24" :name="getContactDisplayName(address)" readonly />
              </template>

              <span :class="$style.contact">
                {{ getContactDisplayName(address) }}
              </span>
            </ui3n-chip>
          </ui3n-tooltip>
        </template>
      </div>

      <ui3n-button
        v-if="isOverflowing && !isBlockOpen && firstRowContactCount !== 0"
        type="secondary"
        :class="$style.btn"
        @click.stop.prevent="extendRecipientsBlock"
      >
        +{{ size(contactList) - firstRowContactCount }}
      </ui3n-button>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins.scss' as mixins;

  .msgTo {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    column-gap: var(--spacing-xs);
  }

  .label {
    padding-top: var(--spacing-s);
    font-size: var(--font-14);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
  }

  .recipients {
    position: relative;
    flex-grow: 1;
    height: var(--spacing-l);
    overflow: hidden;

    &.opened {
      height: auto;
    }

    &.overflowing {
      padding-right: var(--spacing-xxl);
    }
  }

  .body {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .contact {
    display: block;
    font-size: var(--font-10);
    font-weight: 400;
    color: var(--color-text-control-primary-default);
    @include mixins.text-overflow-ellipsis();
  }

  .btn {
    position: absolute !important;
    top: 0;
    right: 0;
    padding: var(--spacing-s) !important;
  }
</style>
