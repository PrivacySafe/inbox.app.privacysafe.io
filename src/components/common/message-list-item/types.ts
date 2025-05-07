import type { IncomingMessageView, OutgoingMessageView } from '@/types';

export interface MessageListItemProps {
  item: IncomingMessageView | OutgoingMessageView;
  markedMessages?: string[];
}

export interface MessageListItemEmits {
  (event: 'mark', value: string): void;
}
