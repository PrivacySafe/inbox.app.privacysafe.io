<script lang="ts" setup>
  import { computed, type ComputedRef } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { useFoldersStore, useMessagesStore } from '@common/store';
  import ContactIcon from '@common/components/contact-icon/contact-icon.vue';
  import { Ui3nBadge, Ui3nIcon } from '@v1nt1248/3nclient-lib';
  import type { MailFolder } from '@common/types';
  import { SYSTEM_FOLDERS } from '@common/constants';
  import size from 'lodash/size';
  import get from 'lodash/get';

  defineProps<{
    user: string;
    connectivityStatusText: string;
  }>();
  const emits = defineEmits<{
    (event: 'close'): void;
  }>();

  const route = useRoute();
  const router = useRouter();

  const { systemFolders } = storeToRefs(useFoldersStore());
  const { messagesByFolders } = storeToRefs(useMessagesStore());

  const currentFolderId = computed(() => route.params?.folderId) as ComputedRef<string>;

  function getBadgeText(folder: MailFolder): number {
    if (folder.id === SYSTEM_FOLDERS.outbox || folder.id === SYSTEM_FOLDERS.draft) {
      return size(get(messagesByFolders.value, [folder.id, 'data'], []));
    }

    return get(messagesByFolders.value, [folder.id, 'unread'], 0)
  }

  async function goToFolder(folder: MailFolder) {
    await router.push({ name: 'folder', params: { folderId: folder.id } });
    emits('close');
  }
</script>

<template>
  <div :class="$style.appMenu">
    <div :class="$style.appMenuHeader">
      <contact-icon
        :size="32"
        :name="user"
        readonly
      />

      <div :class="$style.info">
        <div :class="$style.user">
          {{ user }}
        </div>

        <div :class="$style.status">
          {{ $tr('app.status') }}: {{ $tr(connectivityStatusText) }}
        </div>
      </div>
    </div>

    <div :class="$style.appMenuBody">
      <template
        v-for="systemFolder in systemFolders"
        :key="systemFolder.id"
      >
        <div
          v-touch="() => goToFolder(systemFolder)"
          tabindex="1"
          :class="[$style.systemFolder, systemFolder.id === currentFolderId && $style.systemFolderSelected]"
        >
          <ui3n-icon
            :class="$style.folderIcon"
            :icon="systemFolder.icon || 'round-folder'"
            :color="systemFolder.iconColor || 'var(--color-icon-control-secondary-default)'"
          />

          <span :class="$style.folderName">{{ systemFolder.name }}</span>

          <ui3n-badge
            v-if="getBadgeText(systemFolder)"
            :value="getBadgeText(systemFolder)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@common/assets/styles/_mixins' as mixins;

  .appMenu {
    --app-menu-header-heigh: 48px;

    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-block-primary-default);
  }

  .appMenuHeader {
    display: flex;
    width: 100%;
    height: var(--app-menu-header-heigh);
    padding-left: var(--spacing-s);
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .info {
    position: relative;
    width: calc(100% - 44px);
    color: var(--color-text-control-primary-default);
  }

  .user {
    font-size: var(--font-14);
    font-weight: 700;
    line-height: var(--font-16);
    @include mixins.text-overflow-ellipsis();
  }

  .status {
    font-size: var(--font-12);
    font-weight: 600;
    line-height: var(--font-14);
  }

  .appMenuBody {
    position: relative;
    width: 100%;
    height: calc(100% - var(--app-menu-header-heigh));
    overflow-x: hidden;
    overflow-y: auto;
    padding: var(--spacing-m) 0 64px;
  }

  .systemFolder {
    position: relative;
    display: flex;
    width: calc(100% - var(--spacing-m));
    height: 36px;
    border-radius: var(--spacing-s);
    justify-content: space-between;
    align-items: center;
    column-gap: var(--spacing-s);
    padding: 0 var(--spacing-s) 0 var(--spacing-l);
    cursor: pointer;
    margin: 0 var(--spacing-s) var(--spacing-xs) var(--spacing-s);

    .folderIcon {
      position: absolute;
      left: var(--spacing-s);
      top: 10px;
    }

    .folderName {
      font-size: var(--font-13);
      font-weight: 600;
      line-height: var(--font-16);
      color: var(--color-text-control-primary-default);
    }

    &.systemFolderSelected {
      background-color: var(--color-bg-control-primary-hover);

      & > div {
        color: var(--color-icon-control-accent-default) !important;
      }
    }
  }
</style>
