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
  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { isFileImage, getFileExtension, isFileVideo, isFileAudio } from '@v1nt1248/3nclient-lib/utils';
  import { type Nullable, Ui3nButton, Ui3nIcon, Ui3nProgressCircular, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useAppStore } from '@/common/store/app.store';
  import { createThumbnail } from '@/common/utils/create-thumbnail';
  import type { AttachmentInfo } from '@common/types';

  const props = defineProps<{
    msgId: string;
    isIncomingMessage?: boolean;
    attachment: AttachmentInfo;
  }>();

  const emits = defineEmits<{
    (event: 'download', value: AttachmentInfo): void;
    (event: 'view', value: AttachmentInfo): void;
  }>();

  const { t } = useI18n();

  const appStore = useAppStore();

  const isProcessing = ref(false);
  const iconSize = 88;
  const iconSizeCss = computed(() => `${iconSize}px`);

  const fileExt = computed(() => (getFileExtension(props.attachment.fileName) || '').toLowerCase());
  const isThumbnailAvailable = computed(
    () =>
      (isFileImage({ fullName: props.attachment.fileName }) ||
        isFileVideo({ fullName: props.attachment.fileName }) ||
        fileExt.value === 'pdf') &&
      props.attachment.size,
  );
  const isViewAvailable = computed(
    () =>
      isThumbnailAvailable.value ||
      (isFileAudio({ fullName: props.attachment.fileName }) && props.attachment.size),
  );

  const iconName = computed(() => {
    if (isThumbnailAvailable.value) {
      return '';
    }

    if (
      ['zip', '7z', 'ace', 'cab', 'cbr', 'gz', 'gzip', 'jar', 'rar', 'tar', 'tgz', 'zipx'].includes(fileExt.value)
    ) {
      return 'file-zip';
    }

    if (isFileAudio({ fullName: props.attachment.fileName })) {
      return 'outline-audio-file';
    }

    return 'outline-file-present';
  });

  const imageDataUrl = ref<Nullable<string>>(null);
  const imageViewStyle = computed(() => {
    if (!imageDataUrl.value) {
      return {};
    }

    return { backgroundImage: `url('${imageDataUrl.value}')` };
  });

  async function makeThumbnail() {
    if (!isThumbnailAvailable.value) {
      return;
    }

    isProcessing.value = true;
    try {
      imageDataUrl.value = await createThumbnail({
        attachment: props.attachment,
        incomingMsgId: props.isIncomingMessage ? props.msgId : undefined,
        targetSize: 128,
      });
    } finally {
      isProcessing.value = false;
    }
  }

  function downloadAttachment() {
    if (!props.attachment.size) {
      return;
    }

    emits('download', props.attachment);
  }

  makeThumbnail();
</script>

<template>
  <div :class="[$style.msgAttachment, appStore.isMobileMode && $style.mobileMode]">
    <div
      :class="$style.thumbnail"
      :style="imageViewStyle"
    >
      <ui3n-icon
        v-if="!isThumbnailAvailable"
        :icon="iconName"
        color="var(--color-icon-block-secondary-default)"
        :size="iconSize - 16"
      />

      <div
        v-if="isProcessing"
        :class="$style.loader"
      >
        <ui3n-progress-circular
          size="56"
          indeterminate
        />
      </div>

      <div :class="$style.actions">
        <ui3n-tooltip
          :content="t('msg.content.tooltip.download')"
          placement="top"
          position-strategy="fixed"
          max-content-width="160"
        >
          <ui3n-button
            type="icon"
            color="color(from var(--color-bg-block-primary-default) srgb 75% 75% 75% / 0.5)"
            icon="outline-download-for-offline"
            icon-size="24"
            icon-color="var(--color-icon-button-tritery-default)"
            :disabled="!attachment.size"
            @click.stop.prevent="downloadAttachment"
          />
        </ui3n-tooltip>

        <ui3n-tooltip
          v-if="isViewAvailable"
          :content="t('msg.content.tooltip.view')"
          placement="top"
          position-strategy="fixed"
          max-content-width="160"
        >
          <ui3n-button
            v-if="isViewAvailable"
            type="icon"
            color="color(from var(--color-bg-block-primary-default) srgb 75% 75% 75% / 0.5)"
            icon="outline-preview"
            icon-size="24"
            icon-color="var(--color-icon-button-tritery-default)"
            @click.stop.prevent="emits('view', attachment)"
          />
        </ui3n-tooltip>
      </div>

      <ui3n-icon
        v-if="!attachment.size"
        icon="round-crisis-alert"
        color="var(--color-icon-block-warning-default)"
        size="16"
        :class="$style.broken"
      />
    </div>

    <div :class="$style.name">
      <ui3n-tooltip
        :content="attachment.fileName"
        placement="top"
        position-strategy="fixed"
        max-content-width="160"
      >
        <span>{{ attachment.fileName }}</span>
      </ui3n-tooltip>
    </div>
  </div>
</template>

<style lang="scss" module>
  .msgAttachment {
    --msg-attachment-width: 96px;
    --msg-attachment-height: 128px;
    --msg-attachment-mobile-height: 172px;
    --msg-attachment-icon-size: v-bind(iconSizeCss);

    position: relative;
    width: var(--msg-attachment-width);
    height: var(--msg-attachment-height);
    padding: var(--spacing-xs);
    background-color: var(--color-bg-block-primary-default);
    cursor: pointer;
    padding-bottom: 40px;
    overflow: hidden;
    border-radius: var(--spacing-xs);

    &:hover {
      .actions {
        display: flex;
      }
    }

    &.mobileMode {
      height: var(--msg-attachment-mobile-height);
      border: 1px solid var(--color-border-block-primary-default);

      .actions {
        display: flex;
        left: 0;
        width: 100%;
        height: var(--spacing-xl);
        top: calc(var(--msg-attachment-icon-size) + var(--spacing-l));
        background-color: transparent;
      }
    }
  }

  .thumbnail {
    position: relative;
    min-width: var(--msg-attachment-icon-size);
    width: var(--msg-attachment-icon-size);
    min-height: var(--msg-attachment-icon-size);
    height: var(--msg-attachment-icon-size);
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;

    .broken {
      position: absolute;
      top: -2px;
      right: -2px;
    }
  }

  .loader {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
  }

  .actions {
    display: none;
    position: absolute;
    inset: 0;
    background-color: color(from var(--color-bg-block-primary-default) srgb 75% 75% 75% / 0.5);
    border-radius: 4px;
    z-index: 3;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);

    button[disabled] {
      cursor: default;
    }
  }

  .name {
    user-select: none;
    font-size: var(--font-12);
    font-weight: 500;
    line-height: var(--font-16);
    color: var(--color-text-control-primary-default);
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
    text-align: center;
  }
</style>
