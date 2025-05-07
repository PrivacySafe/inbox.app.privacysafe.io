export interface MessageListProps {
  folder: string;
  markedMessages?: string[];
}

export interface MessageListEmits {
  (event: 'mark', value: string): void;
}
