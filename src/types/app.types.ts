import type { PreparedMessageData } from '@/types/mail.types';

export type AvailableLanguage = 'en';

export type AvailableColorTheme = 'default' | 'dark';

export type ConnectivityStatus = 'offline' | 'online';

export type AppConfig = {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
};

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

export interface AppGlobalEvents {
  'resize-app': void;
  'run-create-message': { data: Partial<PreparedMessageData>, isThisReplyOrForward?: boolean };
}

