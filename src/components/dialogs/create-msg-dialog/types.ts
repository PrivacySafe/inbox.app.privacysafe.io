import type { PreparedMessageData } from '@/types';

export interface CreateMsgDialogProps {
  data: Partial<PreparedMessageData>;
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
