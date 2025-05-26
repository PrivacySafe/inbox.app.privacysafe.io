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
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import { appContactsSrvProxy } from '@common/services/services-provider';
import type { Person, PersonView } from 'src/common/types';

export const useContactsStore = defineStore('contacts', () => {
  const contactList = ref<Array<PersonView & { displayName: string }>>([]);

  async function getContactList() {
    try {
      const data = await appContactsSrvProxy.getContactList();
      contactList.value = (data || []).map(contact => ({
        ...contact,
        displayName: contact.name || contact.mail || '',
      }));
      return contactList.value;
    } catch (error) {
      console.error(error);
    }
  }

  async function addContact(mail: string) {
    await getContactList();
    const isThereSuchContact = contactList.value.find(contact => contact.mail === mail);

    if (isThereSuchContact) {
      throw new Error(`There is the contact with mail ${mail}`);
    }

    const newContact: Person = {
      id: getRandomId(6),
      name: '',
      mail,
      notice: '',
      phone: '',
    };
    await appContactsSrvProxy.upsertContact(newContact);
    await getContactList();
  }

  return {
    contactList,
    getContactList,
    addContact,
  };
});
