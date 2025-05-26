import { PreparedMessageData } from '@common/types';

export interface PreFlightDialogProps {
  msgData: PreparedMessageData;
}

export interface PreFlightDialogEmits {
  (event: 'validate', value: boolean): void;
  (event: 'select', value: string[]): void;
  (event: 'confirm'): void;
}
