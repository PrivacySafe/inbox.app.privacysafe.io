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
  import { inject, onBeforeMount, ref, watch } from 'vue';
  import cloneDeep from 'lodash/cloneDeep';
  import isEqual from 'lodash/isEqual';
  import isEmpty from 'lodash/isEmpty';
  import size from 'lodash/size';
  import { I18nPlugin, I18N_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton } from '@v1nt1248/3nclient-lib';
  import { fileStoreSrv } from '@/services/services-provider';
  import { AttachmentInfo } from '@/types';
  import { FileInfo } from '@/services/labelled-file-store';
  import AttachedItem from './attached-item.vue';

  const props = defineProps<{
    msgId: string;
    value?: AttachmentInfo[];
  }>();
  const emits = defineEmits<{
    (event: 'update', value: AttachmentInfo[]): void;
    (event: 'update:loading', value: boolean): void;
  }>();

  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const isLoading = ref(false);
  const innerValue = ref<AttachmentInfo[]>([]);
  console.log('INNER => ', innerValue.value);

  async function openUploadDialog() {
    console.log('openUploadDialog !!!');
    // @ts-ignore
    const res = await w3n.shell?.fileDialogs?.openFileDialog(
      $tr('msg.create.attach.button'),
      $tr('app.select'),
      true,
    );
    try {
      isLoading.value = true;
      emits('update:loading', true);

      if (res) {
        if (isEmpty(innerValue.value)) {
          innerValue.value = [];
        }

        for (const file of res) {
          const fileId = await fileStoreSrv.addFile(file, { fileName: file.name, messages: [props.msgId] });
          const stat = await file.stat();
          innerValue.value.push({
            id: fileId,
            fileName: file.name,
            size: stat.size!,
          });
        }
        emits('update', innerValue.value);
      }
    } finally {
      isLoading.value = false;
      emits('update:loading', false);
    }
  }

  async function removeItem(itemId: string) {
    const itemIndex = innerValue.value.findIndex(f => f.id === itemId);
    if (itemIndex === -1) return;

    const { id, type } = innerValue.value[itemIndex];
    if (!type) {
      const { messages = [] } = await fileStoreSrv.getInfo(id) as FileInfo;
      // We check if this file is used as an attachment in any other message
      if (size(messages) > 1) {
        const currentMsgIndex = messages.findIndex(mId => mId === props.msgId);
        currentMsgIndex > -1 && (messages.splice(currentMsgIndex, 1));
        await fileStoreSrv.updateInfo(id, { messages });
      } else {
        await fileStoreSrv.delete(id);
      }
    }

    innerValue.value.splice(itemIndex, 1);
    emits('update', innerValue.value);
  }

  async function removeAll() {
    const filesToDelete = innerValue.value.reduce((res, item) => {
      if (!item.type) {
        res.push(item.id);
      }
      return res;
    }, [] as string[]);

    const pr = [] as Array<Promise<void>>;
    for (const fileId of filesToDelete) {
      const { messages = [] } = await fileStoreSrv.getInfo(fileId) as FileInfo;
      if (size(messages) > 1) {
        const currentMsgIndex = messages.findIndex(mId => mId === props.msgId);
        currentMsgIndex > -1 && (messages.splice(currentMsgIndex, 1));
        pr.push(fileStoreSrv.updateInfo(fileId, { messages }));
      } else {
        pr.push(fileStoreSrv.delete(fileId));
      }
    }

    await Promise.allSettled(pr);

    innerValue.value = [];
    emits('update', []);
  }

  onBeforeMount(async () => {
    console.log('# beforeMount => ', props.msgId);
    innerValue.value = cloneDeep(props.value!);
    if (size(innerValue.value) <= 1) return;

    const pr = [] as Array<Promise<void>>;
    for (const item of innerValue.value) {
      const { messages = [] } = await fileStoreSrv.getInfo(item.id) as FileInfo;
      if (!messages.includes(props.msgId)) {
        messages.push(props.msgId);
        pr.push(fileStoreSrv.updateInfo(item.id, { messages }));
      }
    }

    await Promise.allSettled(pr);
  });

  watch(
    () => props.value,
    (val) => {
      if (!isEmpty(val) && !isEqual(val!, innerValue.value)) {
        innerValue.value = cloneDeep(props.value || []);
        console.log('WATCH => ', innerValue.value);
      }
    },
  );
</script>

<template>
  <div :class="$style.attachments">
    <template v-for="file in innerValue" :key="file.id">
      <attached-item
        :item-name="file.fileName"
        :disabled="isLoading"
        @close="removeItem(file.id)"
      />
    </template>

    <ui3n-button
      type="secondary"
      icon="round-attach-file"
      icon-position="left"
      icon-color="var(--color-icon-button-secondary-default)"
      :disabled="isLoading"
      @click.stop.prevent="openUploadDialog"
    >
      {{ $tr('msg.create.attach.button') }}
    </ui3n-button>


    <ui3n-button
      type="icon"
      color="transparent"
      icon="outline-delete"
      icon-color="var(--color-icon-button-secondary-default)"
      :class="$style.deleteBtn"
      :disabled="isLoading"
      @click.stop.prevent="removeAll"
    />
  </div>
</template>

<style lang="scss" module>
  .attachments {
    position: relative;
    display: flex;
    width: 100%;
    min-height: var(--spacing-l);
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--spacing-s);
    padding-right: 36px;
  }

  button.deleteBtn {
    position: absolute;
    right: 0;
    top: 0;
  }
</style>
