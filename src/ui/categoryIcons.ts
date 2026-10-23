import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IonName = ComponentProps<typeof Ionicons>['name'];

/** Icons for default (and common) category names. */
export const CATEGORY_ICONS: Record<string, IonName> = {
  Salary: 'cash-outline',
  'Food & groceries': 'restaurant-outline',
  Transport: 'bus-outline',
  'Airtime & data': 'phone-portrait-outline',
  'Bills & utilities': 'flash-outline',
  'School & education': 'school-outline',
  'Family support': 'people-outline',
  Business: 'briefcase-outline',
  Health: 'medkit-outline',
  Shopping: 'cart-outline',
  'Church & giving': 'heart-outline',
  Savings: 'wallet-outline',
  'Cash withdrawal': 'cash-outline',
  Other: 'ellipsis-horizontal',
};

export function categoryIcon(name: string): IonName {
  return CATEGORY_ICONS[name] ?? 'pricetag-outline';
}

export const TYPE_ICONS: Record<string, IonName> = {
  expense: 'pricetag-outline',
  send: 'arrow-up-circle-outline',
  receive: 'arrow-down-circle-outline',
  salary: 'cash-outline',
  cash_out: 'cash-outline',
  cash_in: 'download-outline',
  airtime: 'phone-portrait-outline',
  bill: 'receipt-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

export const CHANNEL_ICONS: Record<string, IonName> = {
  bank: 'business-outline',
  momo: 'phone-portrait-outline',
  cash: 'cash-outline',
  other: 'ellipsis-horizontal',
};
