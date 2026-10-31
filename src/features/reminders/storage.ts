import * as SecureStore from 'expo-secure-store';

import {
  DEFAULT_DAILY_LOG,
  FREE_SUBSCRIPTION_REMINDER_LIMIT,
  type DailyLogReminder,
  type SubscriptionReminder,
} from './types';

const SUBS_KEY = 'sikalens.reminders.subs.v1';
const DAILY_KEY = 'sikalens.reminders.daily.v1';

function isSub(value: unknown): value is SubscriptionReminder {
  if (!value || typeof value !== 'object') return false;
  const v = value as SubscriptionReminder;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.renewsOn === 'string' &&
    typeof v.remindDaysBefore === 'number' &&
    typeof v.enabled === 'boolean'
  );
}

export async function loadSubscriptionReminders(): Promise<SubscriptionReminder[]> {
  const raw = await SecureStore.getItemAsync(SUBS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSub);
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
