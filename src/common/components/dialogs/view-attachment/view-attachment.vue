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
<script setup lang="ts">
  import { inject } from 'vue';
  import { storeToRefs } from 'pinia';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { isFileImage, isFileVideo, isFileAudio, getFileExtension } from '@v1nt1248/3nclient-lib/utils';
  import { useAppStore } from '@common/store/app.store';
  import { Ui3nButton, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useDownloadAttachments } from '@/common/composables/useDownloadAttachments';
  import type { AttachmentInfo } from '@common/types';
  import ImageView from './attachment-image-view.vue';
  import PdfView from './attachment-pdf-view.vue';
  import VideoView from './attachment-video-view/attachment-video-view.vue';
  import AudioView from './attachment-audio-view/attachment-audio-view.vue';

  const props = defineProps<{
    item: AttachmentInfo;
    msgId: string;
    isIncomingMessage?: boolean;
  }>();
  const emits = defineEmits<{
    (event: 'close'): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const { downloadAttachment } = useDownloadAttachments({
    msgId: props.msgId,
    isIncomingMessage: props.isIncomingMessage,
    $tr,
  });

  const { isMobileMode } = storeToRefs(useAppStore());

  function getFileExt(fileName: string): string {
    return getFileExtension(fileName);
  }
</script>

<template>
  <div :class="[$style.chatMessageAttachmentView, isMobileMode && $style.mobile]">
    <div :class="$style.actions">
      <ui3n-tooltip
        :content="$tr('msg.content.tooltip.download')"
        position-strategy="fixed"
        placement="bottom-end"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          icon="outline-file-download"
          icon-size="24"
          icon-color="var(--color-icon-table-primary-default)"
          @click.stop.prevent="downloadAttachment(item)"
        />
      </ui3n-tooltip>

      <ui3n-tooltip
        :content="$tr('msg.attachment.view.exit')"
        position-strategy="fixed"
        placement="bottom-end"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          icon="round-close"
          icon-size="24"
          icon-color="var(--color-icon-table-primary-default)"
          @click.stop.prevent="emits('close')"
        />
      </ui3n-tooltip>
    </div>

    <image-view
      v-if="isFileImage({ fullName: item.fileName })"
      :item="item"
      :incoming-msg-id="isIncomingMessage ? msgId : undefined"
      :is-mobile-mode="isMobileMode"
    />

    <pdf-view
      v-else-if="getFileExt(item.fileName) === 'pdf'"
      :item="item"
      :incoming-msg-id="isIncomingMessage ? msgId : undefined"
      :is-mobile-mode="isMobileMode"
    />

    <video-view
      v-else-if="isFileVideo({ fullName: item.fileName })"
      :item="item"
      :incoming-msg-id="isIncomingMessage ? msgId : undefined"
      :is-mobile-mode="isMobileMode"
    />

    <audio-view
      v-else-if="isFileAudio({ fullName: item.fileName })"
      :item="item"
      :incoming-msg-id="isIncomingMessage ? msgId : undefined"
      :is-mobile-mode="isMobileMode"
    />
  </div>
</template>

<style lang="scss" module>
  .chatMessageAttachmentView {
    position: fixed;
    inset: 0;
    z-index: 5000;
    background-color: var(--color-bg-block-primary-default);

    &.mobile {
      .actions {
        top: var(--spacing-xs);
      }
    }
  }

  .actions {
    position: fixed;
    top: var(--spacing-s);
    right: var(--spacing-s);
    z-index: 5100;
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);
  }
</style>
