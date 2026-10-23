import type { Network, TxType } from '@/core/parser/types';

export const TYPE_LABEL: Record<TxType, string> = {
  expense: 'Expense',
  send: 'Sent',
  receive: 'Received',
  salary: 'Salary',
  cash_out: 'Cash out',
  cash_in: 'Cash in',
  airtime: 'Airtime / data',
  bill: 'Bill',
  other: 'Other',
};

export const CHANNEL_LABEL: Record<'bank' | 'momo' | 'cash' | 'other', string> = {
  bank: 'Bank',
  momo: 'MoMo',
  cash: 'Cash',
  other: 'Other',
};

export const NETWORK_LABEL: Record<Network, string> = {
  mtn: 'MTN',
  telecel: 'Telecel',
  airteltigo: 'AirtelTigo',
  unknown: 'Not sure',
};
