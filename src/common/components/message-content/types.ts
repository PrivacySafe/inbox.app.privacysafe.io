import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { IncomingMessageView, OutgoingMessageView, MessageAction } from '@common/types';

export interface MessageContentProps {
  message?: Nullable<IncomingMessageView | OutgoingMessageView>;
}

export interface MessageContentEmits {
  (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
}
