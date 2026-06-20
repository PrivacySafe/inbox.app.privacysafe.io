import { computed, inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { DIALOGS_KEY, DialogsPlugin, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import type { Ui3nDialogEvent } from '@v1nt1248/3nclient-lib';
import type { AppGlobalEvents, PreparedMessageData } from '@common/types';
import {
  useAppStore,
  useContactsStore,
  useFoldersStore,
  useMessagesStore,
  useReceivingStore,
  useSendingStore,
} from '@common/store';
import { useCreateMsgActions } from '@common/composables/useCreateMsgActions';
import { SystemSettings } from '@common/utils';
import CreateMsgDialog from '@common/components/dialogs/create-msg-dialog/create-msg-dialog.vue';

export function useAppPage(mobileMode?: boolean) {
  const $bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const $dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;
  const { t } = useI18n();

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
  const { getMessages, deleteMessages } = useMessagesStore();
  const { initializeReceivingService } = useReceivingStore();
  const sendingStore = useSendingStore();
  const { initializeDeliveryService } = sendingStore;

  const { saveMsgToDraft } = useCreateMsgActions();

  const connectivityStatusText = computed(() =>
    connectivityStatus.value === 'online' ? 'app.status.connected.online' : 'app.status.connected.offline',
  );
  const connectivityTimerId = ref<ReturnType<typeof setInterval> | undefined>();

  async function appExit() {
    w3n.closeSelf!();
  }

  async function openCreateMsgDialog(payload: {
    data?: PreparedMessageData;
    isThisReplyOrForward?: boolean;
    sourceFolder?: string;
  }) {
    if (isMobileMode.value) {
      await router.push({
        name: 'message',
        params: { msgId: payload.data?.id },
        query: {
          props: JSON.stringify({
            data: payload.data,
            ...(payload.isThisReplyOrForward && { isThisReplyOrForward: payload.isThisReplyOrForward }),
          }),
          ...(payload.sourceFolder && { sourceFolder: payload.sourceFolder }),
        },
      });
    } else {
      const res = await $dialogs.$openDialog<
        { msgData: PreparedMessageData; withoutSave?: boolean },
        Ui3nDialogEvent<'send'>
      >(CreateMsgDialog, {
        data: payload.data || ({} as PreparedMessageData),
        isThisReplyOrForward: payload.isThisReplyOrForward,
        dialogProps: {
          width: 560,
          cssStyle: {
            height: '90dvh',
          },
          title: t('msg.create.dialog.title'),
          icon: {
            icon: 'round-mail',
            color: 'var(--color-icon-block-accent-default)',
          },
          confirmButton: false,
          cancelButton: false,
          closeOnClickOverlay: false,
          closeOnEsc: true,
        },
      });

      switch (res.event) {
        case 'send': {
          if (res.data?.msgData && !res.data?.withoutSave) {
            await saveMsgToDraft(res.data.msgData!);
          }
          break;
        }

        case 'cancel': {
          if (res.data && res.data.msgData.id) {
            await deleteMessages([res.data.msgData.id], true);
          }
          break;
        }
      }
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
      console.error('# APP MOUNTED ERROR => ', e);
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

  return {
    t,
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
