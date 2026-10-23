import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { listAccounts } from '@/features/accounts/repository';
import {
  exportTransactions,
  type ExportDestination,
  type ExportFormat,
  type ExportPeriod,
} from '@/features/export/share';
import { usePremium } from '@/features/premium/PremiumProvider';
import { useLock } from '@/features/security/LockProvider';
import {
  currentMonth,
  dateRangeLabel,
  isDateInput,
  monthLabel,
  shiftMonth,
  toDateInput,
} from '@/lib/dates';
import { BrandMark } from '@/ui/BrandMark';
import { AppText, Button, Card, Chip, Field, Screen } from '@/ui/kit';
import { MonthPager } from '@/ui/MonthPager';
import { SelectField } from '@/ui/SelectField';
import { space } from '@/ui/theme';

type Mode = 'month' | 'range' | 'all';

const ALL_ACCOUNTS = '__all__';

const PROBLEM: Record<'empty' | 'sharing_unavailable' | 'bad_range' | 'save_cancelled' | 'save_failed', string> = {
  empty: 'There is nothing to export for that period and account.',
  sharing_unavailable: 'This phone cannot open the share sheet.',
  bad_range: 'Check the dates. Use YYYY-MM-DD, for example 2026-10-01.',
  save_cancelled: 'Save cancelled. Choose a folder to keep the file on this phone.',
  save_failed: 'Could not save the file. Try again, or use Share instead.',
};

export default function ExportScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { setPrompting } = useLock();
  const now = currentMonth();
  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState(now);
  const [from, setFrom] = useState(() => `${now}-01`);
  const [to, setTo] = useState(() => toDateInput(new Date().toISOString()));
  const [accountId, setAccountId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState(() => listAccounts());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setAccounts(listAccounts());
    }, []),
  );

  const accountName = useMemo(
    () => (accountId == null ? null : accounts.find((a) => a.id === accountId)?.name ?? null),
    [accountId, accounts],
  );

  const periodPreview = useMemo(() => {
    let period = 'All transactions';
    if (mode === 'month') period = monthLabel(month);
    else if (mode === 'range') {
      period = isDateInput(from) && isDateInput(to) ? dateRangeLabel(from, to) : 'Choose a valid date range';
    }
    return accountName ? `${period} · ${accountName}` : period;
  }, [mode, month, from, to, accountName]);

  const run = async (format: ExportFormat, destination: ExportDestination) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    setError(null);
    let period: ExportPeriod;
    if (mode === 'all') period = { kind: 'all' };
    else if (mode === 'month') period = { kind: 'month', month };
    else {
      if (!isDateInput(from) || !isDateInput(to)) {
        setError('Use dates like 2026-10-01 and 2026-10-31.');
        return;
      }
      period = { kind: 'range', from: from.trim(), to: to.trim() };
    }

    setBusy(true);
    setPrompting(true);
    try {
      const res = await exportTransactions(period, format, destination, accountId);
      if (!res.ok) {
        setError(PROBLEM[res.reason]);
        return;
      }
      const kind = format === 'pdf' ? 'PDF statement' : 'Excel (CSV)';
      Alert.alert(
        destination === 'save' ? `${kind} saved` : `${kind} ready`,
        `${res.rows} transaction${res.rows === 1 ? '' : 's'} · ${periodPreview}` +
          (res.pathHint ? `\n\n${res.pathHint}` : ''),
      );
    } catch {
      setError('Something went wrong creating the file. Try again.');
    } finally {
      setPrompting(false);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Export', presentation: 'modal' }} />
      <AppText variant="title">Export</AppText>
      <AppText tone="soft">
        {isPremium
          ? 'Pick a period and account, then share or save a PDF or Excel file on this phone.'
          : 'CSV and PDF exports are part of Premium.'}
      </AppText>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Account</AppText>
        {accounts.length === 0 ? (
          <AppText tone="soft">Add a MoMo or bank wallet first, or export everything after you have entries.</AppText>
        ) : (
          <SelectField
            label="Which wallet?"
            placeholder="All accounts"
            sheetTitle="Export which account?"
            options={[
              { id: ALL_ACCOUNTS, label: 'All accounts', sublabel: 'Every wallet and bank' },
              ...accounts.map((a) => ({
                id: String(a.id),
                label: a.name,
                sublabel: a.kind === 'momo' ? 'MoMo' : a.kind === 'bank' ? 'Bank' : a.kind === 'cash' ? 'Cash' : 'Other',
                leading: <BrandMark brandId={a.brandId} size="sm" />,
              })),
            ]}
            value={accountId == null ? ALL_ACCOUNTS : String(accountId)}
            onChange={(id) => setAccountId(id === ALL_ACCOUNTS ? null : Number(id))}
          />
        )}
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Period</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip
            label="This month"
            selected={mode === 'month' && month === now}
            onPress={() => {
              setMode('month');
              setMonth(now);
            }}
          />
          <Chip
            label="Last month"
            selected={mode === 'month' && month === shiftMonth(now, -1)}
            onPress={() => {
              if (!isPremium) {
                router.push('/premium');
                return;
              }
              setMode('month');
              setMonth(shiftMonth(now, -1));
            }}
          />
          <Chip label="Custom dates" selected={mode === 'range'} onPress={() => setMode('range')} />
          <Chip label="Everything" selected={mode === 'all'} onPress={() => setMode('all')} />
        </View>

        {mode === 'month' && <MonthPager month={month} isPremium={isPremium} onChange={setMonth} />}

        {mode === 'range' && (
          <View style={{ gap: space.sm }}>
            <AppText variant="caption" tone="soft">
              Inclusive dates (YYYY-MM-DD). MoMo and bank entries on both days are included.
            </AppText>
            <Field
              label="From"
              value={from}
              onChangeText={setFrom}
              keyboardType="numbers-and-punctuation"
              placeholder="2026-10-01"
            />
            <Field
              label="To"
              value={to}
              onChangeText={setTo}
              keyboardType="numbers-and-punctuation"
              placeholder="2026-10-31"
            />
          </View>
        )}

        <AppText variant="caption" tone="soft">
          Exporting: {periodPreview}
        </AppText>
      </Card>

      {error && <AppText tone="out">{error}</AppText>}

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">PDF statement</AppText>
        <Button title="Share PDF" disabled={busy} onPress={() => void run('pdf', 'share')} />
        <Button title="Save PDF on this phone" variant="quiet" disabled={busy} onPress={() => void run('pdf', 'save')} />
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Excel (CSV)</AppText>
        <Button title="Share Excel file" disabled={busy} onPress={() => void run('csv', 'share')} />
        <Button
          title="Save Excel on this phone"
          variant="quiet"
          disabled={busy}
          onPress={() => void run('csv', 'save')}
        />
      </Card>

      <AppText variant="caption" tone="soft">
        On Android, Save asks you to pick a folder (choose Downloads). On iPhone, Save keeps a copy and opens Save to
        Files.
      </AppText>

      {!isPremium && <Button title="See Premium" variant="quiet" onPress={() => router.push('/premium')} />}
    </Screen>
  );
}
