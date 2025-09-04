import { computed, inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
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
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import type { AppGlobalEvents, PreparedMessageData } from '@common/types';
import {
  useAppStore,
  useContactsStore,
  useFoldersStore,
  useMessagesStore,
  useReceivingStore,
  useSendingStore,
} from '@common/store';
import { storeToRefs } from 'pinia';
import { useCreateMsgActions } from '@common/composables/useCreateMsgActions';
import { handleSendingError, SystemSettings } from '@common/utils';
import { SYSTEM_FOLDERS } from '@common/constants';
import CreateMsgDialog from '@common/components/dialogs/create-msg-dialog/create-msg-dialog.vue';

export function useAppPage(mobileMode?: boolean) {
  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const $dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const unsub = ref<() => void>();

  const router = useRouter();

  const appStore = useAppStore();
  const {
    appVersion,
    user: me,
    connectivityStatus,
    isMobileMode,
    commonLoading,
    customLogoSrc,
  } = storeToRefs(appStore);
  const {
    getAppState,
    getAppConfig,
    getAppVersion,
    getUser,
    getConnectivityStatus,
    setLang,
    setColorTheme,
    setCustomLogo,
    setAppWindowSize,
    setMobileMode,
  } = appStore;
  const { loadFolders } = useFoldersStore();
  const { getContactList } = useContactsStore();
  const { getMessages, getMessage, upsertMessage, deleteMessages } = useMessagesStore();
  const { initializeReceivingService } = useReceivingStore();
  const sendingStore = useSendingStore();
  const { initializeDeliveryService, deleteFromListOfSendingMessage, removeMessageFromDeliveryList } = sendingStore;

  const { saveMsgToDraft } = useCreateMsgActions();

  const connectivityStatusText = computed(() =>
    connectivityStatus.value === 'online' ? 'app.status.connected.online' : 'app.status.connected.offline',
  );
  const connectivityTimerId = ref<ReturnType<typeof setInterval> | undefined>();

  async function appExit() {
    w3n.closeSelf!();
  }

  async function openCreateMsgDialog({
    data,
    isThisReplyOrForward,
    sourceFolder,
  }: {
    data?: PreparedMessageData;
    isThisReplyOrForward?: boolean;
    sourceFolder?: string;
  }) {
    if (isMobileMode.value) {
      await router.push({
        name: 'message',
        params: { msgId: data?.id },
        query: {
          props: JSON.stringify({
            data,
            ...(isThisReplyOrForward && { isThisReplyOrForward }),
          }),
          ...(sourceFolder && { sourceFolder }),
        },
      });
    } else {
      $dialogs.$openDialog<typeof CreateMsgDialog>({
        component: CreateMsgDialog,
        componentProps: {
          data: data || ({} as PreparedMessageData),
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
  }

  async function handleExternalCommand({ cmd, params }: web3n.shell.commands.CmdParams) {
    if (cmd === 'open-inbox-with') {
      const cmdArg = params[0] as { peerAddress?: unknown };
      const address = cmdArg?.peerAddress;
      if (!address || typeof address !== 'string') {
        await w3n.log('error', 'Invalid peer address passed in open inbox command');
        return;
      }

      await openCreateMsgDialog({
        data: {
          id: getRandomId(32),
          threadId: getRandomId(32),
          recipients: [address],
          subject: '',
          attachmentsInfo: [],
          htmlTxtBody: '',
        },
      });
    }
  }

  onBeforeMount(async () => {
    try {
      mobileMode && setMobileMode(true);
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

      const config = await SystemSettings.makeResourceReader();
      config.watchConfig({
        next: appConfig => {
          const { lang, colorTheme, customLogo } = appConfig;
          setLang(lang);
          setColorTheme(colorTheme);
          setCustomLogo(customLogo);
        },
      });

      const startCmd = await w3n.shell!.getStartedCmd!();
      if (startCmd) {
        handleExternalCommand(startCmd);
      }

      unsub.value = w3n.shell!.watchStartCmds!({
        next: ({ cmd, params }: web3n.shell.commands.CmdParams) => handleExternalCommand({ cmd, params }),
        error: err => console.error(`Error in listening to commands for inbox app:`, err),
        complete: () => console.log(`Listening to commands for chat app is closed by platform side.`),
      });
    } catch (e) {
      console.error('\nERR-MOUNTED: ', e);
      throw e;
    }
  });

  onBeforeUnmount(() => {
    if (connectivityTimerId.value) {
      clearInterval(connectivityTimerId.value);
    }

    unsub.value && unsub.value();

    $bus.$emitter.off('run-create-message', openCreateMsgDialog);
  });

  sendingStore.$subscribe(
    async (mutation, state) => {
      for (const msgId of Object.keys(state.listOfSendingMessage)) {
        if (!msgId) {
          continue;
        }

        const progress = state.listOfSendingMessage[msgId];
        if (progress.localMeta?.chatId) {
          continue;
        }

        if (progress.allDone) {
          const allDoneValue = progress.allDone;
          const message = getMessage(msgId);
          if (!message) {
            await removeMessageFromDeliveryList(msgId, true);
            continue;
          }

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
              if (recipientInfo.err) {
                const errorFlag = handleSendingError(recipientInfo);
                errorFlag !== null && (res[address] = errorFlag || '');
              }

              return res;
            }, {} as Record<string, string>);

            await upsertMessage({
              ...message!,
              mailFolder:
                size(statusDescription) === size(message?.recipients) ? SYSTEM_FOLDERS.outbox : SYSTEM_FOLDERS.sent,
              status: 'error',
              statusDescription,
            });
          }

          await removeMessageFromDeliveryList(msgId);
          deleteFromListOfSendingMessage(msgId);
        }
      }
    },
    { immediate: true },
  );

  return {
    $bus,
    appVersion,
    me,
    customLogoSrc,
    commonLoading,
    connectivityStatusText,
    appExit,
    setAppWindowSize,
  };
}
