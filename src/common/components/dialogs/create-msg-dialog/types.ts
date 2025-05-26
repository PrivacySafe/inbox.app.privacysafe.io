import type { PreparedMessageData } from '@common/types';

export interface CreateMsgDialogProps {
  data: PreparedMessageData;
  isThisReplyOrForward?: boolean;
}

export interface CreateMsgDialogEmits {
  (
    event: 'select',
    value: { msgData: PreparedMessageData; withoutSave?: boolean },
  ): void;
  (event: 'close'): void;
  (event: 'cancel'): void;
}
