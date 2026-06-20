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
import { inject } from 'vue';
import { NOTIFICATIONS_KEY, NotificationsPlugin } from '@v1nt1248/3nclient-lib/plugins';
import { useMessagesStore, useReceivingStore } from '@common/store';
import type { AttachmentInfo } from '@common/types';

export function useDownloadAttachments({
  msgId,
  isIncomingMessage,
  t,
}: {
  msgId: string;
  isIncomingMessage: boolean;
  t: (txt: string, placeholder?: Record<string, string>) => string;
}) {
  const { $createNotice } = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;
  const { downloadFileFromOutgoingMessage, downloadFilesFromOutgoingMessage } = useMessagesStore();
  const { downloadFileFromIncomingMessage, downloadAttachmentsFromIncomingMessage } = useReceivingStore();

  async function downloadAll(attachments: AttachmentInfo[] = []) {
    try {
      let isSuccess;
      if (isIncomingMessage) {
        isSuccess = await downloadAttachmentsFromIncomingMessage(msgId);
      } else {
        const ids: string[] = attachments.map(item => item.id!);
        isSuccess = await downloadFilesFromOutgoingMessage(msgId, ids);
      }

      if (isSuccess) {
        $createNotice({
          type: 'success',
          content: t('msg.attachments.writing.success'),
        });
      }
    } catch (error) {
      w3n.log('error', `Error downloading attachments of the message with id ${msgId}`, error);

      $createNotice({
        type: 'error',
        content: t('msg.attachments.writing.error'),
      });
    }
  }

  async function downloadAttachment(attachment: AttachmentInfo) {
    try {
      const isSuccess = isIncomingMessage
        ? await downloadFileFromIncomingMessage(msgId, attachment.fileName)
        : await downloadFileFromOutgoingMessage(attachment);

      if (isSuccess) {
        $createNotice({
          type: 'success',
          content: t('msg.attachment.writing.success', { filename: attachment.fileName }),
        });
      }
    } catch (error) {
      w3n.log(
        'error',
        `Error downloading the file '${attachment.fileName}' from the message with id ${msgId}`,
        error,
      );

      $createNotice({
        type: 'error',
        content: t('msg.attachment.writing.error', { fileName: attachment.fileName }),
      });
    }
  }

  return {
    downloadAll,
    downloadAttachment,
  };
}
