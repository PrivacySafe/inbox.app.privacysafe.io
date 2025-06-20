import { PreparedMessageData } from '@common/types';

export interface PreFlightDialogProps {
  msgData: PreparedMessageData;
}

export interface PreFlightDialogEmits {
  (event: 'validate', value: boolean): void;
  (event: 'select', value: Record<string, string>): void;
  (event: 'confirm'): void;
}
