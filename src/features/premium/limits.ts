import { currentMonth } from '@/lib/dates';

/** Free plan tracks this many wallets. Premium has no cap. */
export const FREE_WALLET_LIMIT = 2;

/** Imported MoMo messages older than this are hidden, and cannot be saved, on the free plan. */
export const FREE_SMS_DAYS = 30;

export function canAddWallet(existing: number, isPremium: boolean): boolean {
  return isPremium || existing < FREE_WALLET_LIMIT;
}

/**
 * ISO instant. Imported SMS at or after this stay visible. Null means no cutoff (Premium).
 * Rounded to the hour so the string is stable across renders. A millisecond timestamp
 * in a hook dependency retriggers setState forever.
 */
export function smsCutoffIso(isPremium: boolean, now: Date = new Date()): string | null {
  if (isPremium) return null;
  const cutoff = new Date(now.getTime() - FREE_SMS_DAYS * 86_400_000);
  cutoff.setUTCMinutes(0, 0, 0);
  return cutoff.toISOString();
}

export function smsWithinFreeHistory(occurredAt: string, isPremium: boolean, now: Date = new Date()): boolean {
  const cutoff = smsCutoffIso(isPremium, now);
  return cutoff === null || occurredAt >= cutoff;
}

/** Free plan opens the current month only. */
export function canOpenMonth(month: string, isPremium: boolean, now: Date = new Date()): boolean {
  return isPremium || month === currentMonth(now);
}
