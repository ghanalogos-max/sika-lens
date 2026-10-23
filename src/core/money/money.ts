import { CURRENCIES, type CurrencyId } from '@/features/currency/currencies';

/**
 * Money is stored as integer minor units (pesewas / cents / kobo).
 * Never store or add floats: 0.1 + 0.2 !== 0.3.
 */
export type Pesewas = number;

let displayCurrency: CurrencyId = 'GHS';

/** Called by CurrencyProvider when the user picks a currency. */
export function setDisplayCurrency(id: CurrencyId): void {
  displayCurrency = id;
}

export function getDisplayCurrency(): CurrencyId {
  return displayCurrency;
}

export function currencySymbol(id: CurrencyId = displayCurrency): string {
  return CURRENCIES[id].symbol;
}

export function currencyCode(id: CurrencyId = displayCurrency): string {
  return id;
}

/** "25", "25.5", "1,200.50", "GHS 25.00" -> minor units. Throws on garbage. */
export function toPesewas(input: string | number): Pesewas {
  const cleaned = String(input).replace(/[^\d.]/g, '');
  if (!/\d/.test(cleaned)) throw new Error(`Invalid amount: "${input}"`);
  const [whole = '0', frac = ''] = cleaned.split('.');
  const minor = (frac + '00').slice(0, 2);
  return parseInt(whole || '0', 10) * 100 + parseInt(minor, 10);
}

/** Like toPesewas but returns null instead of throwing (handy for form fields). */
export function tryToPesewas(input: string): Pesewas | null {
  try {
    return toPesewas(input);
  } catch {
    return null;
  }
}

/** Format minor units with the chosen (or given) currency symbol. */
export function formatMoney(
  value: Pesewas,
  opts: { sign?: boolean; currency?: CurrencyId } = {},
): string {
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = (abs % 100).toString().padStart(2, '0');
  const sign = value < 0 ? '-' : opts.sign && value > 0 ? '+' : '';
  const sym = currencySymbol(opts.currency);
  // Letter symbols (CFA, FCFA, CHF, KSh…) need a gap; ₵ $ € £ do not.
  const gap = /[A-Za-z]$/.test(sym) ? ' ' : '';
  return `${sign}${sym}${gap}${whole}.${frac}`;
}

/** @deprecated Prefer formatMoney — kept so existing call sites keep working. */
export function formatGHS(value: Pesewas, opts: { sign?: boolean } = {}): string {
  return formatMoney(value, opts);
}

/** Privacy mask for Home when balances are hidden. */
export function maskGHS(opts: { signed?: '+' | '−' | null; currency?: CurrencyId } = {}): string {
  const prefix = opts.signed ?? '';
  return `${prefix}${currencySymbol(opts.currency)}••••••`;
}

/** ASCII label for PDF / CSV headers (no special symbols). */
export function moneyCodeLabel(id: CurrencyId = displayCurrency): string {
  return id;
}

/** 2500 -> "25.00" (for pre-filling inputs) */
export function pesewasToInput(value: Pesewas): string {
  return (value / 100).toFixed(2);
}
