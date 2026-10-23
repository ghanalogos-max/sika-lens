/**
 * Display currencies for labels / converter.
 * Money in the ledger stays integer minor units; only the symbol and rates change.
 */
export const CURRENCY_IDS = [
  'GHS',
  'USD',
  'EUR',
  'GBP',
  'NGN',
  'XOF',
  'XAF',
  'CAD',
  'CHF',
  'ZAR',
  'KES',
  'CNY',
  'AUD',
] as const;

export type CurrencyId = (typeof CURRENCY_IDS)[number];

export type CurrencyInfo = {
  id: CurrencyId;
  name: string;
  /** Symbol shown before amounts (GH₵, £, CFA…). */
  symbol: string;
  minorLabel: string;
  /** Flag emoji used as the currency “logo” in pickers. */
  flag: string;
  /** Tile colour behind the mark. */
  color: string;
  onColor: string;
};

export const CURRENCIES: Record<CurrencyId, CurrencyInfo> = {
  GHS: {
    id: 'GHS',
    name: 'Ghana cedi',
    symbol: 'GH₵',
    minorLabel: 'pesewas',
    flag: '🇬🇭',
    color: '#CE1126',
    onColor: '#FFFFFF',
  },
  USD: {
    id: 'USD',
    name: 'US dollar',
    symbol: '$',
    minorLabel: 'cents',
    flag: '🇺🇸',
    color: '#3C3B6E',
    onColor: '#FFFFFF',
  },
  EUR: {
    id: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorLabel: 'cents',
    flag: '🇪🇺',
    color: '#003399',
    onColor: '#FFCC00',
  },
  GBP: {
    id: 'GBP',
    name: 'Pound sterling',
    symbol: '£',
    minorLabel: 'pence',
    flag: '🇬🇧',
    color: '#012169',
    onColor: '#FFFFFF',
  },
  NGN: {
    id: 'NGN',
    name: 'Nigerian naira',
    symbol: '₦',
    minorLabel: 'kobo',
    flag: '🇳🇬',
    color: '#008751',
    onColor: '#FFFFFF',
  },
  XOF: {
    id: 'XOF',
    name: 'West African CFA franc',
    symbol: 'CFA',
    minorLabel: 'centimes',
    /** BCEAO zone (HQ Dakar) — used across WAEMU. */
    flag: '🇸🇳',
    color: '#E85D04',
    onColor: '#FFFFFF',
  },
  XAF: {
    id: 'XAF',
    name: 'Central African CFA franc',
    symbol: 'FCFA',
    minorLabel: 'centimes',
    /** BEAC zone (HQ Yaoundé) — used across CEMAC. */
    flag: '🇨🇲',
    color: '#007A3D',
    onColor: '#FFFFFF',
  },
  CAD: {
    id: 'CAD',
    name: 'Canadian dollar',
    symbol: 'CA$',
    minorLabel: 'cents',
    flag: '🇨🇦',
    color: '#FF0000',
    onColor: '#FFFFFF',
  },
  CHF: {
    id: 'CHF',
    name: 'Swiss franc',
    symbol: 'CHF',
    minorLabel: 'rappen',
    flag: '🇨🇭',
    color: '#FF0000',
    onColor: '#FFFFFF',
  },
  ZAR: {
    id: 'ZAR',
    name: 'South African rand',
    symbol: 'R',
    minorLabel: 'cents',
    flag: '🇿🇦',
    color: '#007A4D',
    onColor: '#FFFFFF',
  },
  KES: {
    id: 'KES',
    name: 'Kenyan shilling',
    symbol: 'KSh',
    minorLabel: 'cents',
    flag: '🇰🇪',
    color: '#BB0000',
    onColor: '#FFFFFF',
  },
  CNY: {
    id: 'CNY',
    name: 'Chinese yuan',
    symbol: '¥',
    minorLabel: 'fen',
    flag: '🇨🇳',
    color: '#DE2910',
    onColor: '#FFDE00',
  },
  AUD: {
    id: 'AUD',
    name: 'Australian dollar',
    symbol: 'A$',
    minorLabel: 'cents',
    flag: '🇦🇺',
    color: '#00008B',
    onColor: '#FFFFFF',
  },
};

export function isCurrencyId(value: string | null): value is CurrencyId {
  return value != null && (CURRENCY_IDS as readonly string[]).includes(value);
}

/** Text-only chip label (logo is separate via CurrencyMark). */
export function currencyChipLabel(id: CurrencyId): string {
  const c = CURRENCIES[id];
  return `${c.symbol} ${c.id}`;
}
