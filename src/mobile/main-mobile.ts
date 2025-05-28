/*
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
*/
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  dialogs,
  i18n,
  I18nOptions,
  notifications,
  storeDialogs,
  storeVueBus,
  storeI18n,
  storeNotifications,
  vueBus,
} from '@v1nt1248/3nclient-lib/plugins';
import { piniaRouter } from '@common/plugins/pinia-router';
import { ensureDefaultAnonSenderMaxMsgSize } from '@common/utils';
import { initializationServices } from '@common/services/services-provider';

import App from '@mobile/pages/app.vue';

import '@v1nt1248/3nclient-lib/variables.css';
import '@v1nt1248/3nclient-lib/style.css';
import '@common/assets/styles/main.css';

import en from '@common/data/i18/en.json';

const init = () => {
  initializationServices().then(async () => {
    await ensureDefaultAnonSenderMaxMsgSize(100 * 1024 * 1024);

    const pinia = createPinia();
    pinia.use(piniaRouter);
    pinia.use(storeVueBus);
    pinia.use(storeI18n);
    pinia.use(storeDialogs);
    pinia.use(storeNotifications);

    const app = createApp(App);

    app.config.globalProperties.$router = router;
    // app.config.globalProperties.$store = store
    app.config.compilerOptions.isCustomElement = tag => {
      return tag.startsWith('ui3n-');
    };

    dayjs.extend(relativeTime);

    app
      .use(pinia)
      .use<I18nOptions>(i18n, { lang: 'en', messages: { en } })
      .use(vueBus)
      .use(dialogs)
      .use(notifications)
      .use(router)
      .mount('#mobile');
  });
};

init();
