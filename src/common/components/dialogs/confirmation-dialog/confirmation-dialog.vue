<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';

  const props = defineProps<{
    dialogText?: string;
    additionalDialogText?: string;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const text = computed(() => props.dialogText || $tr('confirmation.dialog.text'));
</script>

<template>
  <div :class="$style.confirmationDialog">
    {{ text }}
    <span v-if="additionalDialogText">{{ additionalDialogText }}</span>
  </div>
</template>

<style lang="scss" module>
  .confirmationDialog {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    row-gap: var(--spacing-s);
    padding: var(--spacing-m);
    font-size: var(--font-14);
    line-height: var(--font-20);
    font-weight: 400;
    color: var(--color-text-block-primary-default);
    text-align: center;
  }
</style>
