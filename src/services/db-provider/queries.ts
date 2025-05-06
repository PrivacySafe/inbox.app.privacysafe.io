export const GET_STATE_QUERY = 'SELECT * FROM app';

export const UPSERT_STATE_QUERY = 'INSERT INTO app (id, state) VALUES ($id, $state) ON CONFLICT(id) DO UPDATE SET id=$id, state=$state';

export const INSERT_FOLDER_QUERY = 'INSERT INTO folders (id, name, icon, iconColor, position, path, isSystem) VALUES ($id, $name, $icon, $iconColor, $position, $path, $isSystem)';

export const GET_FOLDER_LIST_QUERY = 'SELECT * FROM folders';

export const DELETE_FOLDER_BY_ID_QUERY = 'DELETE FROM folders WHERE id=$id';

export const GET_MESSAGES_QUERY = 'SELECT * FROM messages';

export const GET_MESSAGE_QUERY_BY_ID = 'SELECT * FROM messages WHERE msgId=$msgId';

export const GET_MESSAGES_QUERY_BY_THREAD_ID = 'SELECT * FROM messages WHERE threadId=$threadId';

export const INSERT_MESSAGE_QUERY = 'INSERT INTO messages (msgId, threadId, msgType, cTime, deliveryTS, subject, plainTxtBody, htmlTxtBody, jsonBody, recipients, sender, status, statusDescription, attachmentsInfo, mailFolder) VALUES ($msgId, $threadId, $msgType, $cTime, $deliveryTS, $subject, $plainTxtBody, $htmlTxtBody, $jsonBody, $recipients, $sender, $status, $statusDescription, $attachmentsInfo, $mailFolder)';

export const UPSERT_MESSAGE_QUERY = 'INSERT INTO messages (msgId, threadId, msgType, cTime, deliveryTS, subject, plainTxtBody, htmlTxtBody, jsonBody, recipients, sender, status, attachmentsInfo, mailFolder) VALUES ($msgId, $threadId, $msgType, $cTime, $deliveryTS, $subject, $plainTxtBody, $htmlTxtBody, $jsonBody, $recipients, $sender, $status, $attachmentsInfo, $mailFolder) ON CONFLICT(msgId) DO UPDATE SET msgId=$msgId, threadId=$threadId, msgType=$msgType, cTime=$cTime, deliveryTS=$deliveryTS, subject=$subject, plainTxtBody=$plainTxtBody, htmlTxtBody=$htmlTxtBody, jsonBody=$jsonBody, recipients=$recipients, sender=$sender, status=$status, statusDescription=$statusDescription, attachmentsInfo=$attachmentsInfo, mailFolder=$mailFolder';

export const DELETE_MESSAGE_BY_ID_QUERY = `DELETE FROM messages WHERE msgId=$msgId`;
