import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { pesewasToInput, tryToPesewas } from '@/core/money/money';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { usePremium } from '@/features/premium/PremiumProvider';
import { PremiumUpsell } from '@/features/premium/PremiumUpsell';
import { rescheduleAllReminders, notificationsAvailable } from '@/features/reminders/notifications';
import {
  canAddSubscriptionReminder,
  loadDailyLogReminder,
  loadSubscriptionReminders,
  saveSubscriptionReminders,
} from '@/features/reminders/storage';
import { suggestAmountFromLedger } from '@/features/reminders/suggestAmount';
import {
  subscriptionPresetById,
  subscriptionPresetByName,
  type BillingCycle,
  type SubscriptionReminder,
} from '@/features/reminders/types';
import { isDateInput } from '@/lib/dates';
import { DateField } from '@/ui/DateField';
import { AppText, Button, Card, Chip, Field, Screen } from '@/ui/kit';
import { SubscriptionMark } from '@/ui/SubscriptionMark';
import { space, useTheme } from '@/ui/theme';

function newId(): string {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function defaultRenewsOn(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

const DAYS_BEFORE = [1, 2, 3, 5, 7, 14] as const;
const CYCLES: { id: BillingCycle; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export default function SubscriptionReminderScreen() {
  const t = useTheme();
  const money = useFormatMoney();
  const router = useRouter();
  const { isPremium } = usePremium();
  const params = useLocalSearchParams<{ id?: string; name?: string; presetId?: string }>();
  const editId = typeof params.id === 'string' && params.id.length > 0 ? params.id : null;
  const presetName = typeof params.name === 'string' ? params.name : '';
  const paramPresetId = typeof params.presetId === 'string' ? params.presetId : '';

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState(presetName || 'ChatGPT');
  const [presetId, setPresetId] = useState(paramPresetId || '');
  const [renewsOn, setRenewsOn] = useState(defaultRenewsOn);
  const [remindDaysBefore, setRemindDaysBefore] = useState(3);
  const [enabled, setEnabled] = useState(true);
  const [amountText, setAmountText] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [busy, setBusy] = useState(false);
  const [existingCount, setExistingCount] = useState(0);

  const isNew = !editId;

  const hydrate = useCallback(async () => {
    const list = await loadSubscriptionReminders();
    setExistingCount(list.length);
    if (editId) {
      const found = list.find((s) => s.id === editId);
      if (!found) {
        Alert.alert('Not found', 'That subscription reminder was removed.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      setName(found.name);
      setPresetId(found.presetId ?? subscriptionPresetByName(found.name)?.id ?? '');
      setRenewsOn(found.renewsOn);
      setRemindDaysBefore(found.remindDaysBefore);
      setEnabled(found.enabled);
      setAmountText(found.amountPesewas != null ? pesewasToInput(found.amountPesewas) : '');
      setBillingCycle(found.billingCycle);
    } else {
      const fromParam = paramPresetId ? subscriptionPresetById(paramPresetId) : null;
      const fromName = presetName.trim() ? subscriptionPresetByName(presetName) : null;
      const preset = fromParam ?? fromName;
      if (preset) {
        setName(preset.name);
        setPresetId(preset.id);
      } else if (presetName.trim()) {
        setName(presetName.trim());
      }
    }
    setLoaded(true);
  }, [editId, paramPresetId, presetName, router]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const atLimit = isNew && !canAddSubscriptionReminder(existingCount, isPremium);

  const title = useMemo(() => {
    if (!isNew) return name.trim() || 'Subscription';
    return presetName.trim() || 'New subscription';
  }, [isNew, name, presetName]);

  const persistAndSchedule = async (nextList: SubscriptionReminder[]) => {
    await saveSubscriptionReminders(nextList);
    if (!notificationsAvailable()) {
      Alert.alert('Rebuild required', 'Install the next app build to enable phone reminders.');
      return;
    }
    const daily = await loadDailyLogReminder();
    const result = await rescheduleAllReminders(daily, nextList);
    if (!result.ok && result.reason === 'denied') {
      Alert.alert('Notifications off', 'Allow notifications for SikaLens in phone Settings to get reminders.');
    }
  };

  const fillFromLedger = () => {
    const suggested = suggestAmountFromLedger(name.trim() || presetName);
    if (suggested == null) {
      Alert.alert(
        'No matching spend',
        'Paste or log a charge that mentions this name (counterparty or note), then try again — or type the amount.',
      );
      return;
    }
    setAmountText(pesewasToInput(suggested));
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name needed', 'Enter what renews (for example ChatGPT).');
      return;
    }
    if (!isDateInput(renewsOn)) {
      Alert.alert('Date needed', 'Pick the next renewal date.');
      return;
    }
    let amountPesewas: number | null = null;
    if (amountText.trim()) {
      const parsed = tryToPesewas(amountText);
      if (parsed === null) {
        Alert.alert('Check the amount', 'Enter a charge like 49.99, or leave it blank.');
        return;
      }
      amountPesewas = parsed;
    }
    if (atLimit) {
      router.push('/premium');
      return;
    }

    setBusy(true);
    try {
      const list = await loadSubscriptionReminders();
      let next: SubscriptionReminder[];
      const resolvedPreset = presetId || subscriptionPresetByName(trimmed)?.id || undefined;
      const payload = {
        name: trimmed.slice(0, 40),
        presetId: resolvedPreset,
        renewsOn: renewsOn.trim(),
        remindDaysBefore,
        enabled,
        amountPesewas,
        billingCycle,
      };
      if (editId) {
        next = list.map((s) => (s.id === editId ? { ...s, ...payload } : s));
      } else {
        if (!canAddSubscriptionReminder(list.length, isPremium)) {
          router.push('/premium');
          return;
        }
        next = [...list, { id: newId(), ...payload }];
      }
      await persistAndSchedule(next);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!editId) return;
    Alert.alert('Remove reminder?', `Stop reminding you about ${name.trim() || 'this subscription'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              const list = await loadSubscriptionReminders();
              const next = list.filter((s) => s.id !== editId);
              await persistAndSchedule(next);
              router.back();
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <Screen>
        <AppText tone="soft">Loading…</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <SubscriptionMark presetId={presetId || undefined} name={name} size="lg" />
        <View style={{ flex: 1, gap: 6 }}>
          <AppText variant="title">{title}</AppText>
          <AppText tone="soft">
            {isNew
              ? 'Set the charge, renewal date, and when to remind you.'
              : 'Edit amount, renewal date, reminder timing, or turn this alert off.'}
          </AppText>
        </View>
      </View>

      {atLimit ? (
        <PremiumUpsell
          title="Subscription limit reached"
          body="Free keeps 2 renewal reminders. Premium unlocks ChatGPT, Spotify, Claude, and the rest."
        />
      ) : null}

      <Card>
        <Field label="Name" value={name} onChangeText={setName} placeholder="ChatGPT" autoCapitalize="words" />
        <Field
          label={`Amount (${money.symbol})`}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <AppText variant="caption" tone="soft">
          Type the charge, or fill it from a matching spend in your ledger.
        </AppText>
        <Button title="Fill from last matching spend" variant="quiet" onPress={fillFromLedger} />
        <AppText variant="caption" tone="soft">
          Bills
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CYCLES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={billingCycle === c.id}
              onPress={() => setBillingCycle(c.id)}
            />
          ))}
        </View>
        <DateField label="Next renewal" value={renewsOn} onChange={setRenewsOn} />
        <AppText variant="caption" tone="soft">
          Remind me
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DAYS_BEFORE.map((d) => (
            <Chip
              key={d}
              label={`${d} day${d === 1 ? '' : 's'} before`}
              selected={remindDaysBefore === d}
              onPress={() => setRemindDaysBefore(d)}
            />
          ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.md,
            marginTop: space.sm,
          }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="label">Reminder on</AppText>
            <AppText tone="soft">Phone notification before renewal.</AppText>
          </View>
          <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: t.primary, false: t.line }} />
        </View>
      </Card>

      <Button
        title={busy ? 'Saving…' : isNew ? 'Save reminder' : 'Save changes'}
        onPress={() => void save()}
        disabled={busy || atLimit}
      />
      {editId ? <Button title="Remove reminder" variant="quiet" onPress={remove} disabled={busy} /> : null}
    </Screen>
  );
}
