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
  import { Ui3nButton, Ui3nIcon, Ui3nTooltip } from '@v1nt1248/3nclient-lib';

  interface AttachedItemProps {
    itemName: string;
    disabled?: boolean;
  }

  defineProps<AttachedItemProps>();
  const emits = defineEmits(['close']);
</script>

<template>
  <div :class="$style.attachedItem">
    <ui3n-icon
      icon="round-subject"
      color="var(--files-word-primary)"
      width="16"
      height="16"
      :class="$style.icon"
    />

    <ui3n-tooltip
      :content="itemName"
      placement="top-start"
      position-strategy="fixed"
    >
      <div :class="$style.text">
        {{ itemName }}
      </div>
    </ui3n-tooltip>

    <ui3n-button
      type="icon"
      size="small"
      color="transparent"
      icon="round-close"
      icon-color="var(--color-icon-control-primary-default)"
      :class="$style.close"
      :disabled="disabled"
      @click.stop.prevent="emits('close')"
    />
  </div>
</template>

<style lang="scss" module>
  @use '@common/assets/styles/mixins' as mixins;

  .attachedItem {
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
  }

  .icon {
    position: absolute;
    left: var(--spacing-xs);
    top: var(--spacing-xs);
  }

  .text {
    position: relative;
    font-size: var(--font-12);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
    @include mixins.text-overflow-ellipsis();
  }

  button.close {
    position: absolute;
    right: 0;
    top: 0;
  }
</style>
