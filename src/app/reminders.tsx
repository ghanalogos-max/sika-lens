import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';

import { usePremium } from '@/features/premium/PremiumProvider';
import { PremiumUpsell } from '@/features/premium/PremiumUpsell';
import { rescheduleAllReminders, notificationsAvailable } from '@/features/reminders/notifications';
import {
  canAddSubscriptionReminder,
  loadDailyLogReminder,
  loadSubscriptionReminders,
  saveDailyLogReminder,
  saveSubscriptionReminders,
} from '@/features/reminders/storage';
import {
  FREE_SUBSCRIPTION_REMINDER_LIMIT,
  SUBSCRIPTION_PRESETS,
  type DailyLogReminder,
  type SubscriptionReminder,
} from '@/features/reminders/types';
import { AppText, Button, Card, Chip, Screen } from '@/ui/kit';
import { SubscriptionMark } from '@/ui/SubscriptionMark';
import { space, useTheme } from '@/ui/theme';

function formatTime(hour: number, minute: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

const TIME_PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: '5:00 PM', hour: 17, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '7:00 PM', hour: 19, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

export default function RemindersScreen() {
  const t = useTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [daily, setDaily] = useState<DailyLogReminder>({ enabled: true, hour: 18, minute: 0 });
  const [subs, setSubs] = useState<SubscriptionReminder[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setDaily(await loadDailyLogReminder());
    setSubs(await loadSubscriptionReminders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const atLimit = !canAddSubscriptionReminder(subs.length, isPremium);

  const applySchedule = async (nextDaily: DailyLogReminder, nextSubs: SubscriptionReminder[]) => {
    if (!notificationsAvailable()) {
      Alert.alert('Rebuild required', 'Install the next app build to enable phone reminders.');
      return;
    }
    setBusy(true);
    try {
      const result = await rescheduleAllReminders(nextDaily, nextSubs);
      if (!result.ok && result.reason === 'denied') {
        Alert.alert('Notifications off', 'Allow notifications for SikaLens in phone Settings to get reminders.');
      }
    } finally {
      setBusy(false);
    }
  };

  const updateDaily = async (patch: Partial<DailyLogReminder>) => {
    const next = { ...daily, ...patch };
    setDaily(next);
    await saveDailyLogReminder(next);
    await applySchedule(next, subs);
  };

  const toggleSub = async (id: string, enabled: boolean) => {
    const next = subs.map((s) => (s.id === id ? { ...s, enabled } : s));
    setSubs(next);
    await saveSubscriptionReminders(next);
    await applySchedule(daily, next);
  };

  const openSub = (id: string) => {
    router.push({ pathname: '/subscription-reminder', params: { id } });
  };

  const openNew = (preset?: { id: string; name: string }) => {
    if (atLimit) {
      router.push('/premium');
      return;
    }
    router.push({
      pathname: '/subscription-reminder',
      params: preset ? { name: preset.name, presetId: preset.id } : {},
    });
  };

  const limitLabel = useMemo(
    () =>
      isPremium
        ? 'Premium — unlimited subscription reminders'
        : `Free — up to ${FREE_SUBSCRIPTION_REMINDER_LIMIT} subscription reminders`,
    [isPremium],
  );

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <AppText variant="title">Reminders</AppText>
        <AppText tone="soft">{limitLabel}</AppText>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="label">Evening ledger check-in</AppText>
            <AppText tone="soft">
              Reminds you to log MoMo and bank activity at {formatTime(daily.hour, daily.minute)}.
            </AppText>
          </View>
          <Switch
            value={daily.enabled}
            onValueChange={(enabled) => void updateDaily({ enabled })}
            trackColor={{ true: t.primary, false: t.line }}
          />
        </View>
        {daily.enabled ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.sm }}>
            {TIME_PRESETS.map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                selected={daily.hour === p.hour && daily.minute === p.minute}
                onPress={() => void updateDaily({ hour: p.hour, minute: p.minute })}
              />
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <AppText variant="label">Subscription renewals</AppText>
        <AppText tone="soft">
          Open ChatGPT, Spotify, Claude, and others on their own page to set renewal dates. Free keeps{' '}
          {FREE_SUBSCRIPTION_REMINDER_LIMIT}; Premium unlocks more.
        </AppText>

        {subs.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => openSub(s.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: t.line,
            }}>
            <SubscriptionMark presetId={s.presetId} name={s.name} size="sm" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label">{s.name}</AppText>
              <AppText variant="caption" tone="soft">
                Renews {s.renewsOn} · remind {s.remindDaysBefore}d before
              </AppText>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={(enabled) => void toggleSub(s.id, enabled)}
              trackColor={{ true: t.primary, false: t.line }}
            />
            <AppText tone="primary">Open</AppText>
          </Pressable>
        ))}

        {atLimit ? (
          <PremiumUpsell
            title="More subscription reminders"
            body="Premium tracks every renewal — Spotify, ChatGPT, Claude, and the rest."
          />
        ) : null}

        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <AppText variant="caption" tone="soft">
            Add a subscription
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SUBSCRIPTION_PRESETS.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                leading={<SubscriptionMark preset={p} size="sm" />}
                onPress={() => openNew(p)}
              />
            ))}
          </View>
          <Button
            title={busy ? 'Working…' : 'Custom subscription'}
            variant="quiet"
            onPress={() => openNew()}
            disabled={busy}
          />
        </View>
      </Card>
    </Screen>
  );
}
