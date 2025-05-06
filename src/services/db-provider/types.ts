import type { AppState, IncomingMessageView, MailFolder, OutgoingMessageView } from '@/types';
import type { Nullable } from '@v1nt1248/3nclient-lib';

export interface DBProvider {
  getAppState(): AppState;
  updateAppState(state: AppState): Promise<void>;
  addFolder(folderData: MailFolder, noDiskWrite?: boolean): Promise<MailFolder[]>
  deleteFolder(folderData: MailFolder, noDiskWrite?: boolean): Promise<MailFolder[]>
  getFolderList(): MailFolder[];
  addMessage(
    msgData: IncomingMessageView | OutgoingMessageView,
    noDiskWrite?: boolean,
  ): Promise<Array<IncomingMessageView | OutgoingMessageView>>;
  updateMessage(
    msgData: IncomingMessageView | OutgoingMessageView,
    noDiskWrite?: boolean,
  ): Promise<Array<IncomingMessageView | OutgoingMessageView>>
  deleteMessageById(msgId: string, noDiskWrite?: boolean): Promise<Array<IncomingMessageView | OutgoingMessageView>>
  getMessageById(msgId: string): Nullable<IncomingMessageView | OutgoingMessageView>
  getMessages(): Array<IncomingMessageView | OutgoingMessageView>;
}
