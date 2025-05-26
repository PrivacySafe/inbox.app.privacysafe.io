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
  error,
}: {
  $tr: (key: string, placeholders?: Record<string, string>) => string;
  address: string;
  error: web3n.asmail.DeliveryException;
}): Nullable<string> {
  const domain = address.includes('@') ? address.split('@')[1] : '';

  if (hasIn(error, 'unknownRecipient')) {
    return `[${address}] ${$tr('msg.sending.error.unknownRecipient')}`;
  }

  if (hasIn(error, 'msgTooBig')) {
    return `[${address}] ${$tr('msg.sending.error.msgTooBig')}`;
  }

  if (hasIn(error, 'inboxIsFull')) {
    return `[${address}] ${$tr('msg.sending.error.inboxIsFull')}`;
  }

  if (hasIn(error, 'domainNotFound')) {
    return `[${domain}] ${$tr('msg.sending.error.domainNotFound')}`;
  }

  if (hasIn(error, 'noServiceRecord')) {
    return `[${domain}] ${$tr('msg.sending.error.noServiceRecord')}`;
  }

  return null;
}

export function handleSendingError<T extends string>({
  $tr,
  address,
  errorInfo,
}: {
  $tr: (key: string, placeholders?: Record<string, string>) => string;
  address: string;
  errorInfo?: DeliveryProgress['recipients'][T];
}): Nullable<string> {
  if (!errorInfo?.err) return null;

  const { err = {} } = errorInfo;
  return prepareErrorText({ $tr, address, error: err as web3n.asmail.DeliveryException });
}
