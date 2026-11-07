export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export type SubscriptionReminder = {
  id: string;
  /** Display name, e.g. Spotify */
  name: string;
  /** Optional preset id for logo lookup (spotify, chatgpt, …). */
  presetId?: string;
  /** Next renewal date YYYY-MM-DD */
  renewsOn: string;
  /** Days before renewsOn to notify (1–14). */
  remindDaysBefore: number;
  enabled: boolean;
  /** Charge amount in minor units (pesewas/cents). Null when not set. */
  amountPesewas: number | null;
  /** How often the charge repeats — used for the monthly total. */
  billingCycle: BillingCycle;
};

/** Convert a subscription charge into an equivalent monthly total (minor units). */
export function monthlyEquivalentPesewas(sub: Pick<SubscriptionReminder, 'amountPesewas' | 'billingCycle' | 'enabled'>): number {
  if (!sub.enabled || sub.amountPesewas == null || sub.amountPesewas <= 0) return 0;
  if (sub.billingCycle === 'weekly') return Math.round((sub.amountPesewas * 52) / 12);
  if (sub.billingCycle === 'yearly') return Math.round(sub.amountPesewas / 12);
  return sub.amountPesewas;
}

export function sumMonthlySubscriptions(subs: SubscriptionReminder[]): number {
  return subs.reduce((sum, s) => sum + monthlyEquivalentPesewas(s), 0);
}

export type DailyLogReminder = {
  enabled: boolean;
  /** Local hour 0–23 */
  hour: number;
  /** Local minute 0–59 */
  minute: number;
};

export type SubscriptionPreset = {
  id: string;
  name: string;
  short: string;
  color: string;
  onColor: string;
};

export const FREE_SUBSCRIPTION_REMINDER_LIMIT = 2;

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { id: 'spotify', name: 'Spotify', short: 'Sp', color: '#1DB954', onColor: '#FFFFFF' },
  { id: 'chatgpt', name: 'ChatGPT', short: 'GPT', color: '#10A37F', onColor: '#FFFFFF' },
  { id: 'claude', name: 'Claude', short: 'Cl', color: '#D97757', onColor: '#FFFFFF' },
  { id: 'netflix', name: 'Netflix', short: 'N', color: '#E50914', onColor: '#FFFFFF' },
  { id: 'youtube', name: 'YouTube Premium', short: 'YT', color: '#FF0000', onColor: '#FFFFFF' },
  { id: 'apple_music', name: 'Apple Music', short: 'AM', color: '#FA2D55', onColor: '#FFFFFF' },
  { id: 'disney', name: 'Disney+', short: 'D+', color: '#113CCF', onColor: '#FFFFFF' },
  { id: 'microsoft365', name: 'Microsoft 365', short: '365', color: '#D24726', onColor: '#FFFFFF' },
  { id: 'icloud', name: 'iCloud+', short: 'iC', color: '#3691F7', onColor: '#FFFFFF' },
  { id: 'adobe', name: 'Adobe', short: 'Ae', color: '#EB1423', onColor: '#FFFFFF' },
];

const byId = new Map(SUBSCRIPTION_PRESETS.map((p) => [p.id, p]));
const byName = new Map(SUBSCRIPTION_PRESETS.map((p) => [p.name.toLowerCase(), p]));

export function subscriptionPresetById(id: string): SubscriptionPreset | null {
  return byId.get(id) ?? null;
}

export function subscriptionPresetByName(name: string): SubscriptionPreset | null {
  const key = name.trim().toLowerCase();
  if (byName.has(key)) return byName.get(key)!;
  return SUBSCRIPTION_PRESETS.find((p) => key.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(key)) ?? null;
}

export const DEFAULT_DAILY_LOG: DailyLogReminder = {
  enabled: true,
  hour: 18,
  minute: 0,
};
