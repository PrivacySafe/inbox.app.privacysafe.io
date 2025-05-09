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
  import { computed, inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
  import { storeToRefs } from 'pinia';
  import hasIn from 'lodash/hasIn';
  import get from 'lodash/get';
  import size from 'lodash/size';
  import {
    DIALOGS_KEY,
    DialogsPlugin,
    I18N_KEY,
    I18nPlugin,
    VUEBUS_KEY,
    VueBusPlugin,
  } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nMenu, Ui3nProgressCircular, Ui3nResize, type Ui3nResizeCbArg, Ui3nRipple } from '@v1nt1248/3nclient-lib';
  import prLogo from '@/assets/images/logo.svg';
  import {
    useAppStore,
    useContactsStore,
    useFoldersStore,
    useMessagesStore,
    useReceivingStore,
    useSendingStore,
  } from '@/store';
  import { UISettings } from '@/utils/ui-settings';
  import type { AppGlobalEvents, PreparedMessageData } from '@/types';
  import { useCreateMsgActions } from '@/composables/useCreateMsgActions';
  import ContactIcon from '@/components/common/contact-icon.vue';
  import CreateMsgDialog from '@/components/dialogs/create-msg-dialog/create-msg-dialog.vue';
  import { SYSTEM_FOLDERS } from '@/constants';
  import { handleSendingError } from '@/utils';

  const vUi3nResize = Ui3nResize;
  const vUi3nRipple = Ui3nRipple;

  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const $dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const appStore = useAppStore();
  const { appVersion, user: me, connectivityStatus, commonLoading } = storeToRefs(appStore);
  const {
    getAppState,
    getAppConfig,
    getAppVersion,
    getUser,
    getConnectivityStatus,
    setLang,
    setColorTheme,
    setAppWindowSize,
  } = appStore;
  const { loadFolders } = useFoldersStore();
  const { getContactList } = useContactsStore();
  const { getMessages, getMessage, upsertMessage, deleteMessages } = useMessagesStore();
  const { initializeReceivingService } = useReceivingStore();
  const sendingStore = useSendingStore();
  const { initializeDeliveryService, deleteFromListOfSendingMessage, removeMessageFromDeliveryList } = sendingStore;

  const { saveMsgToDraft } = useCreateMsgActions();

  const appElement = ref<Element | null>(null);

  const connectivityStatusText = computed(() =>
    connectivityStatus.value === 'online' ? 'app.status.connected.online' : 'app.status.connected.offline',
  );
  const connectivityTimerId = ref<ReturnType<typeof setInterval> | undefined>();

  async function appExit() {
    w3n.closeSelf!();
  }

  function onResize(value: Ui3nResizeCbArg) {
    setAppWindowSize({ width: value.width, height: value.contentHeight });
    $bus.$emitter.emit('resize-app', void 0);
  }

  function openCreateMsgDialog({ data, isThisReplyOrForward }: {
    data?: Partial<PreparedMessageData>,
    isThisReplyOrForward?: boolean
  }) {
    $dialogs.$openDialog<typeof CreateMsgDialog>({
      component: CreateMsgDialog,
      componentProps: {
        data: data || {},
        isThisReplyOrForward,
      },
      dialogProps: {
        width: 560,
        title: $tr('msg.create.dialog.title'),
        icon: {
          icon: 'round-mail',
          color: 'var(--color-icon-block-accent-default)',
        },
        confirmButton: false,
        cancelButton: false,
        closeOnClickOverlay: false,
        closeOnEsc: true,
        // @ts-ignore
        onClose: async (data: { msgData: PreparedMessageData; withoutSave?: boolean }) => {
          console.log('# ONCLOSE => ', data);
          if (data?.msgData && !data?.withoutSave) {
            await saveMsgToDraft(data.msgData!);
          }
        },
        // @ts-ignore
        onCancel: async (data: { msgData: PreparedMessageData; withoutSave?: boolean }) => {
          console.log('# ONCANCEL => ', data);
          if (data && data.msgData.id) {
            await deleteMessages([data.msgData.id], true);
          }
        },
      },
    });
  }

  onBeforeMount(async () => {
    try {
      getAppState();
      await getAppVersion();
      await getUser();
      await getAppConfig();
      await getConnectivityStatus();
      await getContactList();
      loadFolders();
      await getMessages();
      await initializeReceivingService();
      await initializeDeliveryService();

      connectivityTimerId.value = setInterval(getConnectivityStatus, 60000);

      $bus.$emitter.on('run-create-message', openCreateMsgDialog);

      const config = await UISettings.makeResourceReader();
      config.watchConfig({
        next: appConfig => {
          const { lang, colorTheme } = appConfig;
          setLang(lang);
          setColorTheme(colorTheme);
        },
      });
    } catch (e) {
      console.error('\nERR-MOUNTED: ', e);
      throw e;
    }
  });

  onMounted(() => {
    if (appElement.value) {
      const { width, height } = appElement.value.getBoundingClientRect();
      setAppWindowSize({ width, height });
    }
  });

  onBeforeUnmount(() => {
    if (connectivityTimerId.value) {
      clearInterval(connectivityTimerId.value);
    }

    $bus.$emitter.off('run-create-message', openCreateMsgDialog);
  });

  sendingStore.$subscribe(async (mutation, state) => {
    for (const msgId of Object.keys(state.listOfSendingMessage)) {
      const progress = state.listOfSendingMessage[msgId];

      if (progress.allDone) {
        const allDoneValue = progress.allDone;
        const message = getMessage(msgId);

        if (allDoneValue === 'all-ok') {
          await upsertMessage({
            ...message!,
            mailFolder: SYSTEM_FOLDERS.sent,
            deliveryTS: Date.now(),
            status: 'sent',
          });
        } else if (allDoneValue === 'with-errors') {
          const statusDescription = Object.keys(progress.recipients || []).reduce((res, address) => {
            const recipientInfo = get(progress, ['recipients', address]);
            if (hasIn(recipientInfo, 'err')) {
              const info = handleSendingError({ $tr, address, errorInfo: recipientInfo });
              info && res.push(info);
            }

            return res;
          }, [] as string[]);

          await upsertMessage({
            ...message!,
            mailFolder: size(statusDescription) === size(message?.recipients) ? SYSTEM_FOLDERS.outbox : SYSTEM_FOLDERS.sent,
            status: 'error',
            statusDescription,
          });
        }

        await removeMessageFromDeliveryList(msgId);
        deleteFromListOfSendingMessage(msgId);
      }
    }
  }, { immediate: true });
</script>

<template>
  <div
    ref="appElement"
    v-ui3n-resize="onResize"
    :class="$style.app"
  >
    <div :class="$style.toolbar">
      <div :class="$style.toolbarTitle">
        <img
          :src="prLogo"
          alt="logo"
          :class="$style.toolbarLogo"
        >
        <div :class="$style.delimiter">
          /
        </div>
        <div :class="$style.info">
          {{ $tr('app.title') }}
          <div :class="$style.version">
            v {{ appVersion }}
          </div>
        </div>
      </div>

      <div :class="$style.user">
        <div :class="$style.userInfo">
          <span :class="$style.mail">
            {{ me }}
          </span>
          <span :class="$style.connection">
            {{ $tr('app.status') }}:
            <span :class="connectivityStatusText === 'app.status.connected.online' && $style.connectivity">
              {{ $tr(connectivityStatusText) }}
            </span>
          </span>
        </div>

        <ui3n-menu
          position-strategy="fixed"
          :offset-y="4"
        >
          <div
            v-ui3n-ripple
            :class="$style.icon"
          >
            <contact-icon
              :name="me"
              :size="36"
              :readonly="true"
            />
          </div>

          <template #menu>
            <div :class="$style.menu">
              <div
                :class="$style.menuItem"
                @click="appExit"
              >
                {{ $tr('app.exit') }}
              </div>
            </div>
          </template>
        </ui3n-menu>
      </div>
    </div>

    <div :class="$style.content">
      <router-view v-slot="{ Component }">
        <transition>
          <component :is="Component" />
        </transition>
      </router-view>

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

    <div id="notification" />
  </div>
</template>

<style lang="scss" module>
  @use '../assets/styles/mixins' as mixins;

  .app {
    --main-toolbar-height: calc(var(--spacing-s) * 9);

    position: fixed;
    inset: 0;
  }

  .toolbar {
    position: relative;
    width: 100%;
    height: var(--main-toolbar-height);
    padding: 0 var(--spacing-m);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }

  .toolbarTitle {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-m);
  }

  .toolbarLogo {
    position: relative;
    top: -2px;
  }

  .delimiter {
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    color: var(--color-text-control-accent-default);
  }

  .info {
    position: relative;
    width: max-content;
    font-size: var(--font-16);
    font-weight: 500;
    line-height: 28px;
    color: var(--color-text-control-primary-default);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .version {
    color: var(--color-text-control-secondary-default);
    line-height: 28px;
  }

  .user {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .userInfo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    margin-right: var(--spacing-m);

    span:not(.connectivity) {
      color: var(--color-text-control-primary-default);
      line-height: 1.4;
    }
  }

  .mail {
    font-size: var(--font-14);
    font-weight: 600;
  }

  .connection {
    font-size: var(--font-12);
    font-weight: 500;
  }

  .connectivity {
    color: var(--success-content-default);
  }

  .icon {
    position: relative;
    cursor: pointer;
    overflow: hidden;
    border-radius: 50%;
  }

  .menu {
    position: relative;
    background-color: var(--color-bg-control-secondary-default);
    width: max-content;
    border-radius: var(--spacing-xs);
    @include mixins.elevation(1);
  }

  .menuItem {
    position: relative;
    width: 60px;
    height: var(--spacing-l);
    padding: 0 var(--spacing-s);
    font-size: var(--font-13);
    font-weight: 500;
    color: var(--color-text-control-primary-default);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;

    &:hover {
      background-color: var(--color-bg-control-primary-hover);
      color: var(--color-text-control-accent-default);
    }
  }

  .content {
    position: fixed;
    left: 0;
    right: 0;
    top: calc(var(--main-toolbar-height) + 1px);
    bottom: 0;
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
