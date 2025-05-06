import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { IncomingMessageView, MessageAction, OutgoingMessageView } from '@/types';

export interface MessageProps {
  message?: Nullable<IncomingMessageView | OutgoingMessageView>;
}

export interface MessageEmits {
  (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
}
