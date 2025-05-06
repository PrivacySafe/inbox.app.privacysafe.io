import { IncomingMessageView, OutgoingMessageView } from '@/types';

export interface MessageListItemProps {
  item: IncomingMessageView | OutgoingMessageView;
  selectedItemId?: string;
}

export interface MessageListItemEmits {
  (event: 'select', value: IncomingMessageView | OutgoingMessageView): void;
}
