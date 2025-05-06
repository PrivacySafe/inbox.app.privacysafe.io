export interface MailFolderContentProps {
  folder: string;
}

export interface MessageListEmits {
  (event: 'select', value: string): void;
}
