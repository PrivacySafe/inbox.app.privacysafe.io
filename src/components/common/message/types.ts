import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { IncomingMessageView, MessageAction, MessageBulkActions, OutgoingMessageView } from '@/types';

export interface MessageProps {
  folder: string;
  messageId?: Nullable<string>;
  markedMessages?: string[];
}

export interface MessageEmits {
  (event: 'action', value: { action: MessageAction; message: IncomingMessageView | OutgoingMessageView }): void;
  (event: 'bulk-actions', value: { action: MessageBulkActions; messageIds: string[] }): void;
}
