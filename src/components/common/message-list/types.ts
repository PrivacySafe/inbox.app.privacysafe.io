import type { Nullable } from '@v1nt1248/3nclient-lib';

export interface MessageListProps {
  folder: string;
  selectedMessageId?: string;
}

export interface MessageListEmits {
  (event: 'select', value: Nullable<string>): void;
}
