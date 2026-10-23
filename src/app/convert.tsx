import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { tryToPesewas } from '@/core/money/money';
import { CURRENCIES, type CurrencyId } from '@/features/currency/currencies';
import { CurrencyPicker } from '@/features/currency/CurrencyPicker';
import { useCurrency } from '@/features/currency/CurrencyProvider';
import {
  convertMajor,
  fetchLiveRates,
  RATES_DOCS,
  RATES_PROVIDER,
  type RatesSnapshot,
} from '@/features/currency/rates';
import { AppText, Button, Card, Field, Screen } from '@/ui/kit';
import { space, useTheme } from '@/ui/theme';

export default function ConvertScreen() {
  const t = useTheme();
  const { currency: displayCurrency } = useCurrency();
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState<CurrencyId>(displayCurrency);
  const [to, setTo] = useState<CurrencyId>(displayCurrency === 'GHS' ? 'USD' : 'GHS');
  const [snapshot, setSnapshot] = useState<RatesSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (force = false) => {
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await fetchLiveRates('USD', force));
    } catch {
      setError('Could not reach the live rates. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const major = (() => {
    const p = tryToPesewas(amount);
    return p == null ? null : p / 100;
  })();
  const converted = snapshot && major != null ? convertMajor(major, from, to, snapshot) : null;
  const rate =
    snapshot && snapshot.rates[from] && snapshot.rates[to] ? convertMajor(1, from, to, snapshot) : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const resultSym = CURRENCIES[to].symbol;
  const resultGap = /[A-Za-z]$/.test(resultSym) ? ' ' : '';

  return (
    <Screen>
      <AppText variant="title">Currency converter</AppText>
      <AppText tone="soft">
        Live mid-market rates for MoMo, bank, and travel amounts. Your ledger figures stay as you typed them.
      </AppText>

      <Card style={{ gap: space.md }}>
        <Field
          label={`Amount (${CURRENCIES[from].symbol})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <CurrencyPicker label="From" value={from} onChange={setFrom} sheetTitle="Convert from" />

        <Pressable
          onPress={swap}
          accessibilityRole="button"
          accessibilityLabel="Swap currencies"
          style={{
            alignSelf: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: t.primarySoft,
          }}>
          <AppText variant="label" tone="primary">
            Swap
          </AppText>
        </Pressable>

        <CurrencyPicker label="To" value={to} onChange={setTo} sheetTitle="Convert to" />

        <View style={{ gap: 4, paddingTop: space.sm }}>
          <AppText variant="caption" tone="soft">
            Equals
          </AppText>
          <AppText variant="display" style={{ fontSize: 32 }}>
            {converted == null
              ? '—'
              : `${resultSym}${resultGap}${converted.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </AppText>
          {rate != null && (
            <AppText variant="caption" tone="soft">
              1 {from} ≈ {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {to}
            </AppText>
          )}
        </View>

        {error && <AppText tone="out">{error}</AppText>}
        <Button title={busy ? 'Updating…' : 'Refresh rates'} variant="quiet" onPress={() => void load(true)} disabled={busy} />
        {snapshot && (
          <AppText variant="caption" tone="soft">
            Rates updated {snapshot.date}
          </AppText>
        )}
      </Card>

      <Card>
        <AppText variant="label">About these rates</AppText>
        <AppText tone="soft">
          Rates come from {RATES_PROVIDER} (open access). They update about once a day and are for guidance, not bank
          settlement.
        </AppText>
        <Button title="Rate provider docs" variant="quiet" onPress={() => void Linking.openURL(RATES_DOCS)} />
      </Card>
    </Screen>
  );
}
