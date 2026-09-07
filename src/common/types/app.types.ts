import type { PreparedMessageData } from './mail.types';

export type AvailableLanguage = 'en';

export type AvailableColorTheme = 'default' | 'dark' | 'dark2';

export type ConnectivityStatus = 'offline' | 'online';

export interface AppConfig {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
  customLogo?: string;
}

export interface AppConfigsInternal {
  getSettingsFile: () => Promise<AppSettings>;
  saveSettingsFile: (data: AppSettings) => Promise<void>;
  getCurrentLanguage: () => Promise<AvailableLanguage>;
  getCurrentColorTheme: () => Promise<AvailableColorTheme>;
}

export interface AppConfigs {
  getCurrentLanguage: () => Promise<AvailableLanguage>;
  getCurrentColorTheme: () => Promise<AvailableColorTheme>;
  watchConfig(obs: web3n.Observer<AppConfig>): () => void;
}

export interface SettingsJSON {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
}

export interface AppSettings {
  currentConfig: SettingsJSON;
}

export interface AppState {
  lastReceivingTimestamp: number;
}

/**
 * What the avatar menu can ask for. One list for the desktop menu and the phone
 * drawer, so the two cannot drift apart in what they offer.
 */
export type AppMenuAction = 'make-backup' | 'restore-backup' | 'exit';

export interface AppMenuItem {
  id: AppMenuAction;
  icon: string;
  label: string;
}

export interface AppGlobalEvents {
  'resize-app': void;
  'run-create-message': { data: PreparedMessageData, isThisReplyOrForward?: boolean, sourceFolder?: string };
  'sending-complete': { id: string; status: 'ok' | 'error' };
  'open-inbox-msg': { msgId: string };
}

