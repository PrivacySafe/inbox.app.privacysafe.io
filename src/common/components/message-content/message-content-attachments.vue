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
  import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import get from 'lodash/get';
  import size from 'lodash/size';
  import hasIn from 'lodash/hasIn';
  import {
    I18N_KEY,
    I18nPlugin,
    VUEBUS_KEY,
    VueBusPlugin,
    NOTIFICATIONS_KEY,
    NotificationsPlugin,
  } from '@v1nt1248/3nclient-lib/plugins';
  import { type Nullable, Ui3nButton, Ui3nIcon, Ui3nTooltip, Ui3nRipple as vUi3nRipple } from '@v1nt1248/3nclient-lib';
  import { useMessagesStore, useReceivingStore } from '@common/store';
  import type { AppGlobalEvents, AttachmentInfo, IncomingMessageView, OutgoingMessageView } from '@common/types';

  const props = defineProps<{
    message: IncomingMessageView | OutgoingMessageView;
    readonly?: boolean;
  }>();

  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const $notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;
  const { downloadFileFromOutgoingMessage, downloadFilesFromOutgoingMessage } = useMessagesStore();
  const { downloadFileFromIncomingMessage, downloadAttachmentsFromIncomingMessage } = useReceivingStore();

  const wrapperEl = ref<Nullable<HTMLDivElement>>(null);
  const bodyEl = ref<Nullable<HTMLDivElement>>(null);
  const isBlockOpen = ref(false);
  const isOverflowing = ref(true);
  const firstRowFilesCount = ref(0);
  const widthOfFirstRowFiles = ref(0);

  const isIncomingMessage = computed(() => hasIn(props.message, 'sender'));
  const attachments = computed(() => get(props.message, 'attachmentsInfo', [] as AttachmentInfo[]));
  const widthOfFirstRowFilesCss = computed(() => `${widthOfFirstRowFiles.value}px`);

  function initAttachmentListDisplaying() {
    isBlockOpen.value = false;
    isOverflowing.value = true;
    firstRowFilesCount.value = 0;
    widthOfFirstRowFiles.value = 0;

    setTimeout(() => {
      if (wrapperEl.value && bodyEl.value && !isBlockOpen.value) {
        isOverflowing.value = bodyEl.value.clientHeight > wrapperEl.value.clientHeight;

        if (isOverflowing.value) {
          if (isBlockOpen.value || !bodyEl.value || size(bodyEl.value?.children) === 0) {
            firstRowFilesCount.value = 0;
          } else {
            const bodyElWidth = bodyEl.value.clientWidth;
            let startWidth = 0;

            [firstRowFilesCount.value, widthOfFirstRowFiles.value] = [...bodyEl.value.children].reduce((acc, el) => {
              startWidth += (el.clientWidth + 8);
              if (startWidth < bodyElWidth) {
                acc[0] += 1;
                acc[1] = startWidth;
              }

              return acc;
            }, [0, 0]);
          }
        }
      }
    }, 250);
  }

  function toggleDisplayingAttachments(value: boolean) {
    isBlockOpen.value = value;
  }

  async function downloadAll() {
    try {
      let isSuccess;
      if (isIncomingMessage.value) {
        isSuccess = await downloadAttachmentsFromIncomingMessage(props.message.msgId!);
      } else {
        const ids: string[] = (props.message.attachmentsInfo || []).map(item => item.id!);
        isSuccess = await downloadFilesFromOutgoingMessage(props.message.msgId, ids);
      }

      if (isSuccess) {
        $notifications.$createNotice({
          type: 'success',
          content: 'Attachments is saved.',
        });
      }
    } catch (error) {
      w3n.log('error', `Error downloading attachments of the message with id ${props.message.msgId}`, error);

      $notifications.$createNotice({
        type: 'error',
        content: 'Error writing attachments.',
      });
    }
  }

  async function downloadAttachment(attachment: AttachmentInfo) {
    try {
      const isSuccess = isIncomingMessage.value
        ? await downloadFileFromIncomingMessage(props.message.msgId!, attachment.fileName)
        : await downloadFileFromOutgoingMessage(attachment);

      if (isSuccess) {
        $notifications.$createNotice({
          type: 'success',
          content: `The file ${attachment.fileName} is saved.`,
        });
      }
    } catch (error) {
      w3n.log('error', `Error downloading the file '${attachment.fileName}' from the message with id ${props.message.msgId}`, error);

      $notifications.$createNotice({
        type: 'error',
        content: `Error writing the file ${attachment.fileName}.`,
      });
    }

  }

  onMounted(() => {
    $bus.$emitter.on('resize-app', initAttachmentListDisplaying);
  });

  onBeforeUnmount(() => {
    $bus.$emitter.off('resize-app', initAttachmentListDisplaying);
  });

  watch(
    () => props.message.msgId,
    (val, oVal) => {
      if (val !== oVal) {
        initAttachmentListDisplaying();
      }
    }, {
      immediate: true,
    },
  );
</script>

<template>
  <div
    ref="wrapperEl"
    :class="[
      $style.msgAttachments,
      isBlockOpen && $style.opened,
      isOverflowing && $style.overflowing
    ]"
  >
    <ui3n-tooltip
      :content="$tr('msg.content.tooltip.download-all')"
      position-strategy="fixed"
      placement="top-end"
      :disabled="readonly"
    >
      <ui3n-button
        v-if="!readonly"
        type="icon"
        icon="outline-download-for-offline"
        icon-color="var(--color-icon-button-secondary-default)"
        :class="$style.downloadAll"
        @click.stop.prevent="downloadAll"
      />
    </ui3n-tooltip>

    <div
      ref="bodyEl"
      :class="$style.attachmentsBody"
    >
      <template
        v-for="attachment in attachments"
        :key="attachment.id"
      >
        <ui3n-tooltip
          :content="attachment.fileName"
          placement="top-start"
          position-strategy="fixed"
        >
          <div :class="[$style.attachment, readonly && $style.attachmentReadonly]">
            <ui3n-icon
              icon="round-subject"
              color="var(--files-word-primary)"
              width="16"
              height="16"
              :class="$style.prependIcon"
            />

            <span :class="$style.fileName">
              {{ attachment.fileName }}
            </span>

            <div
              v-if="!readonly"
              v-ui3n-ripple
              :class="$style.btn"
              @click.stop.prevent="downloadAttachment(attachment)"
            >
              <ui3n-icon
                icon="outline-download-for-offline"
                color="var(--color-icon-control-accent-default)"
                width="16"
                height="16"
              />
            </div>
          </div>
        </ui3n-tooltip>
      </template>

      <ui3n-button
        v-if="isOverflowing && isBlockOpen"
        type="secondary"
        :class="$style.lessBtn"
        @click.stop.prevent="toggleDisplayingAttachments(false)"
      >
        {{ $tr('msg.content.attachments.collapse') }}
      </ui3n-button>
    </div>

    <ui3n-button
      v-if="isOverflowing && !isBlockOpen && firstRowFilesCount !== 0"
      type="secondary"
      :class="$style.moreBtn"
      @click.stop.prevent="toggleDisplayingAttachments(true)"
    >
      +{{ size(attachments) - firstRowFilesCount }}
    </ui3n-button>
  </div>
</template>

<style lang="scss" module>
  @use '@common/assets/styles/mixins' as mixins;

  .msgAttachments {
    position: relative;
    width: 100%;
    height: var(--spacing-ml);
    padding-right: var(--spacing-xl);
    overflow: hidden;

    &.opened {
      height: auto;
    }
  }

  .downloadAll {
    --ui3n-button-bg-color-custom: var(--color-bg-block-primary-default) !important;

    position: absolute !important;
    right: 0;
    top: -4px;
  }

  .attachmentsBody {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: var(--spacing-s);
  }

  .attachment {
    position: relative;
    width: max-content;
    max-width: 200px;
    height: var(--spacing-ml);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 var(--spacing-ml);
    border-radius: var(--spacing-xs);
    background-color: var(--color-bg-control-secondary-default);

    &.attachmentReadonly {
      padding-right: var(--spacing-s);
    }
  }

  .prependIcon {
    position: absolute;
    left: var(--spacing-xs);
    top: var(--spacing-xs);
  }

  .fileName {
    user-select: none;
    font-size: var(--font-12);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
    @include mixins.text-overflow-ellipsis();
  }

  .btn {
    position: absolute;
    width: var(--spacing-m);
    min-width: var(--spacing-m);
    height: var(--spacing-m);
    min-height: var(--spacing-m);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
    cursor: pointer;

    &:hover {
      background-color: var(--color-bg-button-secondary-hover);
    }
  }

  .moreBtn,
  .lessBtn {
    height: var(--spacing-ml) !important;
    padding: var(--spacing-xs) var(--spacing-s) !important;
  }

  .moreBtn {
    position: absolute !important;
    top: 0;
    left: v-bind(widthOfFirstRowFilesCss);
  }
</style>
