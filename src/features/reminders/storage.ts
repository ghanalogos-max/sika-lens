import * as SecureStore from 'expo-secure-store';

import {
  DEFAULT_DAILY_LOG,
  FREE_SUBSCRIPTION_REMINDER_LIMIT,
  type DailyLogReminder,
  type SubscriptionReminder,
} from './types';

const SUBS_KEY = 'sikalens.reminders.subs.v1';
const DAILY_KEY = 'sikalens.reminders.daily.v1';

function normalizeSub(value: unknown): SubscriptionReminder | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<SubscriptionReminder>;
  if (
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    typeof v.renewsOn !== 'string' ||
    typeof v.remindDaysBefore !== 'number' ||
    typeof v.enabled !== 'boolean'
  ) {
    return null;
  }
  const cycle = v.billingCycle;
  const billingCycle =
    cycle === 'weekly' || cycle === 'yearly' || cycle === 'monthly' ? cycle : 'monthly';
  const amountPesewas =
    typeof v.amountPesewas === 'number' && Number.isFinite(v.amountPesewas) && v.amountPesewas >= 0
      ? Math.round(v.amountPesewas)
      : null;
  return {
    id: v.id,
    name: v.name,
    presetId: typeof v.presetId === 'string' ? v.presetId : undefined,
    renewsOn: v.renewsOn,
    remindDaysBefore: v.remindDaysBefore,
    enabled: v.enabled,
    amountPesewas,
    billingCycle,
  };
}

export async function loadSubscriptionReminders(): Promise<SubscriptionReminder[]> {
  const raw = await SecureStore.getItemAsync(SUBS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSub).filter((s): s is SubscriptionReminder => s != null);
  } catch {
    return [];
  }
}

export async function saveSubscriptionReminders(items: SubscriptionReminder[]): Promise<void> {
  await SecureStore.setItemAsync(SUBS_KEY, JSON.stringify(items));
}

export async function loadDailyLogReminder(): Promise<DailyLogReminder> {
  const raw = await SecureStore.getItemAsync(DAILY_KEY);
  if (!raw) return { ...DEFAULT_DAILY_LOG };
  try {
    const parsed = JSON.parse(raw) as Partial<DailyLogReminder>;
    return {
      enabled: parsed.enabled !== false,
      hour: typeof parsed.hour === 'number' ? Math.min(23, Math.max(0, Math.floor(parsed.hour))) : 18,
      minute: typeof parsed.minute === 'number' ? Math.min(59, Math.max(0, Math.floor(parsed.minute))) : 0,
    };
  } catch {
    return { ...DEFAULT_DAILY_LOG };
  }
}

export async function saveDailyLogReminder(value: DailyLogReminder): Promise<void> {
  await SecureStore.setItemAsync(DAILY_KEY, JSON.stringify(value));
}

export function canAddSubscriptionReminder(count: number, isPremium: boolean): boolean {
  return isPremium || count < FREE_SUBSCRIPTION_REMINDER_LIMIT;
}
