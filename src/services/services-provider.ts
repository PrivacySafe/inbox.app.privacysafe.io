/*
 Copyright (C) 2024-2025 3NSoft Inc.

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
import { makeServiceCaller } from '@/libs/ipc/ipc-service-caller';
import { makeLabelledFileStoreIn, type LabelledFileStore } from './labelled-file-store';
import { dbProvider } from './db-provider';
import type { AppContacts } from '@/types';
import type { DBProvider } from './db-provider/types';

export let fileStoreSrv: LabelledFileStore;
export let appContactsSrvProxy: AppContacts;
export let dbSrv: DBProvider;

export async function initializationServices() {
  fileStoreSrv = await makeLabelledFileStoreIn('mail-app-files');
  dbSrv = await dbProvider();

  appContactsSrvProxy = await w3n.rpc!.otherAppsRPC!('contacts.app.privacysafe.io', 'AppContacts').then(
    srvConn =>
      makeServiceCaller<AppContacts>(srvConn, ['getContact', 'getContactList', 'upsertContact']) as AppContacts,
  );
}
