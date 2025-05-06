<script lang="ts" setup>
  import { inject } from 'vue';
  import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import messageBgImg from './message-bg.png';
  import type { MessageProps, MessageEmits } from './types';
  import MessageContent from '@/components/common/message-content/message-content.vue';

  defineProps<MessageProps>();
  const emits = defineEmits<MessageEmits>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
</script>

<template>
  <div :class="$style.messageWrap">
    <div v-if="!message" :class="$style.empty">
      <img :src="messageBgImg" alt="bgImg" />
      <div :class="$style.emptyText">
        <p>{{ $tr('msg.no.selected.part1') }}</p>
        <p>{{ $tr('msg.no.selected.part2') }}</p>
      </div>
    </div>

    <template v-else>
      <message-content :message="message" @action="emits('action', $event)" />
    </template>
  </div>
</template>

<style lang="scss" module>
  .messageWrap {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: var(--spacing-s);
    background-color: var(--color-bg-chat-bubble-general-bg);
    overflow-y: auto;
  }

  .empty {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    row-gap: 72px;
  }

  .emptyText {
    position: relative;
    width: 180px;
    font-size: var(--font-14);
    font-weight: 400;
    line-height: var(--font-20);
    color: var(--color-text-block-primary-default);

    p {
      margin: 0;
      text-align: center;
    }
  }
</style>
