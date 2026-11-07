import { Platform } from 'react-native';

import type { DailyLogReminder, SubscriptionReminder } from './types';

const DAILY_ID = 'sikalens-daily-log';
const SUB_PREFIX = 'sikalens-sub-';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as NotificationsModule;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  Notifications = null;
}

export function notificationsAvailable(): boolean {
  return Notifications != null && Platform.OS !== 'web';
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return !!asked.granted;
}

function parseRenewDate(renewsOn: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(renewsOn.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function cancelIds(ids: string[]): Promise<void> {
  if (!Notifications) return;
  await Promise.all(ids.map((id) => Notifications!.cancelScheduledNotificationAsync(id).catch(() => {})));
}

export async function rescheduleAllReminders(
  daily: DailyLogReminder,
  subs: SubscriptionReminder[],
): Promise<{ ok: true } | { ok: false; reason: 'unavailable' | 'denied' }> {
  if (!Notifications || Platform.OS === 'web') return { ok: false, reason: 'unavailable' };
  const allowed = await ensureNotificationPermission();
  if (!allowed) return { ok: false, reason: 'denied' };

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const ours = existing
    .map((n) => n.identifier)
    .filter((id) => id === DAILY_ID || id.startsWith(SUB_PREFIX));
  await cancelIds(ours);

  if (daily.enabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: {
        title: 'Log today’s MoMo & bank activity',
        body: 'Open SikaLens and paste any SMS or add what you spent — keep your ledger current.',
        sound: true,
      },
      // Daily calendar trigger (local timezone).
      trigger: {
        type: 'daily',
        hour: daily.hour,
        minute: daily.minute,
      } as never,
    });
  }

  const now = Date.now();
  for (const sub of subs) {
    if (!sub.enabled) continue;
    const renew = parseRenewDate(sub.renewsOn);
    if (!renew) continue;
    const fire = new Date(renew);
    fire.setDate(fire.getDate() - Math.max(0, Math.min(14, sub.remindDaysBefore)));
    fire.setHours(10, 0, 0, 0);
    if (fire.getTime() <= now) continue;
    const amountBit =
      sub.amountPesewas != null && sub.amountPesewas > 0
        ? ` About ${(sub.amountPesewas / 100).toFixed(2)} (${sub.billingCycle}).`
        : '';
    await Notifications.scheduleNotificationAsync({
      identifier: `${SUB_PREFIX}${sub.id}`,
      content: {
        title: `${sub.name} renews soon`,
        body: `${sub.name} renews on ${sub.renewsOn}.${amountBit} Open SikaLens if you want to note the charge.`,
        sound: true,
      },
      trigger: {
        type: 'date',
        date: fire,
      } as never,
    });
  }

  return { ok: true };
}
