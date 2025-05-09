<script lang="ts" setup>
  import { inject } from 'vue';
  import size from 'lodash/size';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nTooltip  } from '@v1nt1248/3nclient-lib';
  import type { MessageBulkActions } from '@/types';
  import { SYSTEM_FOLDERS } from '@/constants';

  withDefaults(defineProps<{
    folder: string;
    markedMessages?: string[];
  }>(), {
    markedMessages: () => [],
  });
  const emits = defineEmits<{
    (event: 'bulk-actions', value: { action: MessageBulkActions; messageIds: string[] }): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
</script>

<template>
  <div :class="$style.bulkActionsToolbar">
    <div :class="$style.block">
      <span :class="$style.info">
        {{ $tr('msg.bulk.actions.selected') }}: {{ size(markedMessages) }}
      </span>

      <div :class="$style.btns">
        <ui3n-tooltip
          v-if="folder === SYSTEM_FOLDERS.trash"
          :content="$tr('msg.content.tooltip.restore')"
          position-strategy="fixed"
          placement="top-start"
        >
          <ui3n-button
            type="icon"
            color="var(--color-bg-block-primary-default)"
            icon="round-refresh"
            icon-color="var(--color-icon-table-primary-default)"
            @click.stop.prevent="emits('bulk-actions', { action: 'restore', messageIds: markedMessages })"
          />
        </ui3n-tooltip>

        <ui3n-tooltip
          v-if="folder !== SYSTEM_FOLDERS.trash"
          :content="$tr('msg.content.btn.moveToTrash')"
          position-strategy="fixed"
          placement="top-start"
        >
          <ui3n-button
            type="icon"
            color="var(--color-bg-block-primary-default)"
            icon="outline-delete"
            icon-color="var(--color-icon-table-primary-default)"
            @click.stop.prevent="emits('bulk-actions', { action: 'move-to-trash', messageIds: markedMessages })"
          />
        </ui3n-tooltip>

        <ui3n-tooltip
          :content="$tr('msg.content.btn.deleteForever')"
          position-strategy="fixed"
          placement="top-start"
        >
          <ui3n-button
            type="icon"
            color="var(--color-bg-block-primary-default)"
            icon="trash-can"
            icon-color="var(--warning-content-default)"
            @click.stop.prevent="emits('bulk-actions', { action: 'delete', messageIds: markedMessages })"
          />
        </ui3n-tooltip>
      </div>
    </div>

    <ui3n-tooltip
      :content="$tr('msg.bulk.actions.btn.cancel.tooltip')"
      position-strategy="fixed"
      placement="top-end"
    >
      <ui3n-button
        type="secondary"
        @click.stop.prevent="emits('bulk-actions', { action: 'cancel', messageIds: markedMessages })"
      >
        {{ $tr('msg.bulk.actions.btn.cancel') }}
      </ui3n-button>
    </ui3n-tooltip>
  </div>
</template>

<style lang="scss" module>
  .bulkActionsToolbar {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color-bg-block-primary-default);
    padding: 0 var(--spacing-m);
  }

  .block {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-ml);
  }

  .info {
    font-size: var(--font-12);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
  }

  .btns {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
  }
</style>
