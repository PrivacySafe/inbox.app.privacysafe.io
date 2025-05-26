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
  import { computed, inject, ref } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute } from 'vue-router';
  import size from 'lodash/size';
  import get from 'lodash/get';
  import { VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nBadge, Ui3nButton, Ui3nProgressCircular } from '@v1nt1248/3nclient-lib';
  import { useMessagesStore } from '@common/store';
  import { useAppPage } from '@common/composables/useAppPage';
  import { MAIL_FOLDERS_DEFAULT, SYSTEM_FOLDERS } from '@common/constants';
  import type { AppGlobalEvents } from '@common/types';
  import AppMenu from '@mobile/components/app-menu/app-menu.vue';
  import { getRandomId } from '@v1nt1248/3nclient-lib/utils';

  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;

  const route = useRoute();
  const { me, connectivityStatusText, commonLoading } = useAppPage(true);
  const { messagesByFolders } = storeToRefs(useMessagesStore());

  const isMenuOpen = ref(false);

  const currentFolder = computed(() => {
    const { name, params } = route;
    if (name !== 'folder') {
      return { name: '', id: null };
    }

    const { folderId } = params as { folderId: string };
    const folder = MAIL_FOLDERS_DEFAULT.find(mf => mf.id === folderId);

    return folder || { name: '', id: null };
  });

  const currentFolderBadgeText = computed(() => {
    if (!currentFolder.value.id) {
      return '';
    }

    if (currentFolder.value.id === SYSTEM_FOLDERS.outbox || currentFolder.value.id === SYSTEM_FOLDERS.draft) {
      return size(get(messagesByFolders.value, [currentFolder.value.id, 'data'], []));
    }

    return get(messagesByFolders.value, [currentFolder.value.id, 'unread'], 0)
  });

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function createNewMessage() {
    $bus.$emitter.emit('run-create-message', {
      data: {
        id: getRandomId(32),
        threadId: getRandomId(32),
        recipients: [],
        subject: '',
        attachmentsInfo: [],
        htmlTxtBody: '',
      },
    });
  }
</script>

<template>
  <div :class="$style.app">
    <transition name="slide-fade">
      <div
        v-if="isMenuOpen"
        :class="$style.menu"
      >
        <app-menu
          :user="me"
          :connectivity-status-text="connectivityStatusText"
          @close="isMenuOpen = false"
        />
      </div>
    </transition>

    <div :class="[$style.body, isMenuOpen && $style.bodyDisabled]">
      <div :class="$style.toolbar">
        <transition>
          <ui3n-button
            v-touch="toggleMenu"
            type="icon"
            :color="isMenuOpen ? 'transparent' : 'var(--color-bg-block-primary-default)'"
            :icon="isMenuOpen ? 'round-close' : 'round-menu'"
            icon-color="var(--color-icon-block-primary-default)"
            icon-size="20"
            :disabled="commonLoading"
          />
        </transition>

        <div :class="$style.folder">
          <span :class="$style.folderName">{{ currentFolder.name }}</span>

          <ui3n-badge
            v-if="currentFolderBadgeText"
            :value="currentFolderBadgeText"
          />
        </div>

        <span />
      </div>

      <div :class="$style.content">
        <router-view v-slot="{ Component }">
          <transition>
            <component :is="Component" />
          </transition>
        </router-view>

        <ui3n-button
          v-touch="createNewMessage"
          type="icon"
          color="var(--color-bg-button-primary-default)"
          icon="round-plus"
          icon-color="var(--color-icon-button-primary-default)"
          icon-size="20"
          :disabled="commonLoading"
          :class="$style.createBtn"
        />

        <div
          v-if="commonLoading"
          :class="$style.loader"
        >
          <ui3n-progress-circular
            indeterminate
            size="100"
          />
        </div>
      </div>
    </div>

    <div id="notification" />
  </div>
</template>

<style lang="scss" module>
  @use '@common/assets/styles/mixins' as mixins;

  .app {
    --main-toolbar-height: 48px;

    position: fixed;
    inset: 0;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
    overflow: hidden;
  }

  .menu {
    position: relative;
    min-width: 80%;
    width: 80%;
    height: 100%;
    z-index: 1;
  }

  .body {
    position: relative;
    min-width: 100%;
    width: 100%;
    height: 100%;

    &.bodyDisabled {
      background-color: var(--files-darker);

      .toolbar {
        border-bottom: none !important;
      }

      .content {
        pointer-events: none;

        &::after {
          position: absolute;
          content: '';
          inset: 0;
          z-index: 5;
          background-color: var(--files-darker);
        }
      }
    }
  }

  .toolbar {
    position: relative;
    width: 100%;
    height: var(--main-toolbar-height);
    padding: 0 var(--spacing-xl) 0 var(--spacing-s);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }

  .folder {
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .folderName {
    font-size: var(--font-16);
    font-weight: 700;
    color: var(--color-text-block-primary-default);
  }

  .content {
    position: relative;
    width: 100%;
    height: calc(100% - var(--main-toolbar-height) - 1px);
  }

  .createBtn {
    position: absolute !important;
    bottom: var(--spacing-m);
    right: var(--spacing-m);
    z-index: 2;
  }

  .loader {
    position: absolute;
    inset: 0;
    z-index: 10;
    background-color: var(--black-12);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }

  #notification {
    position: fixed;
    bottom: var(--spacing-xs);
    left: var(--spacing-m);
    right: var(--spacing-m);
    z-index: 5000;
    height: auto;
    display: flex;
    justify-content: center;
    align-content: flex-end;
  }
</style>

<style lang="scss">
  .slide-fade-enter-active {
    transition: all 0.2s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
  }
</style>
