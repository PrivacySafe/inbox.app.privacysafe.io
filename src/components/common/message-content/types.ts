import type { IncomingMessageView, OutgoingMessageView, MessageAction } from '@/types';

export interface MessageContentProps {
  message: IncomingMessageView | OutgoingMessageView;
}

export interface MessageContentEmits {
  (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
}
