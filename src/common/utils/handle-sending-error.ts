/*
  Copyright (C) 2025 3NSoft Inc.

  This program is free software: you can redistribute it and/or modify it under
  the terms of the GNU General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any later
  version.

  This program is distributed in the hope that it will be useful, but
  WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  this program. If not, see <http://www.gnu.org/licenses/>.
*/
import hasIn from 'lodash/hasIn';
import DeliveryProgress = web3n.asmail.DeliveryProgress;
import type { Nullable } from '@v1nt1248/3nclient-lib';

export function prepareErrorText({
  $tr,
  address,
  errorFlag,
}: {
  $tr: (key: string, placeholders?: Record<string, string>) => string;
  address: string;
  errorFlag: string;
}): string {
  const domain = address.includes('@') ? address.split('@')[1] : '';

  if (errorFlag === 'unknownRecipient') {
    return `[${address}] ${$tr('msg.sending.error.unknownRecipient')}`;
  }

  if (errorFlag === 'msgTooBig') {
    return `[${address}] ${$tr('msg.sending.error.msgTooBig')}`;
  }

  if (errorFlag === 'inboxIsFull') {
    return `[${address}] ${$tr('msg.sending.error.inboxIsFull')}`;
  }

  if (errorFlag === 'domainNotFound') {
    return `[${domain}] ${$tr('msg.sending.error.domainNotFound')}`;
  }

  if (errorFlag === 'noServiceRecord') {
    return `[${domain}] ${$tr('msg.sending.error.noServiceRecord')}`;
  }

  if (errorFlag === 'recipientPubKeyFailsValidation') {
    return `[${address}] ${$tr('msg.sending.error.recipientPubKeyFailsValidation')}`;
  }

  return `[${address}] ${$tr('msg.sending.error.noDescription')}`;
}

export function getStatusDescriptionText(
  { $tr, statusDescription }:
  { $tr: (key: string, placeholders?: Record<string, string>) => string; statusDescription: Record<string, string> },
): string {
  return Object.entries(statusDescription).reduce((res, [address, errorFlag]) => {
    res = res + `${prepareErrorText({ $tr, address, errorFlag })}. `
    return res;
  }, '' as string).trim();
}

export function handleSendingError<T extends string>(errorInfo: DeliveryProgress['recipients'][T]): Nullable<string> {
  if (!errorInfo?.err) return null;

  const { err = {} } = errorInfo;

  if (hasIn(err, 'domainNotFound')) return 'domainNotFound';

  if (hasIn(err, 'unknownRecipient')) return 'unknownRecipient';

  if (hasIn(err, 'senderNotAllowed')) return 'senderNotAllowed';

  if (hasIn(err, 'inboxIsFull')) return 'inboxIsFull';

  if (hasIn(err, 'badRedirect')) return 'badRedirect';

  if (hasIn(err, 'authFailedOnDelivery')) return 'authFailedOnDelivery';

  if (hasIn(err, 'msgTooBig')) return 'msgTooBig';

  if (hasIn(err, 'allowedSize')) return 'allowedSize';

  if (hasIn(err, 'recipientHasNoPubKey')) return 'recipientHasNoPubKey';

  if (hasIn(err, 'recipientPubKeyFailsValidation')) return 'recipientPubKeyFailsValidation';

  if (hasIn(err, 'msgNotFound')) return 'msgNotFound';

  if (hasIn(err, 'msgCancelled')) return 'msgCancelled';

  return '';
}
