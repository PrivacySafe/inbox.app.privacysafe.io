<script lang="ts" setup>
  import { inject } from 'vue';
  import size from 'lodash/size';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nTooltip  } from '@v1nt1248/3nclient-lib';
  import type { MessageBulkActions } from '@/types';

  withDefaults(defineProps<{
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
    <span :class="$style.info">
      {{ $tr('msg.bulk.actions.selected') }}: {{ size(markedMessages) }}
    </span>

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

  .info {
    font-size: var(--font-12);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
  }
</style>
