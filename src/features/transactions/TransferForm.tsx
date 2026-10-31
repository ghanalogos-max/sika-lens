import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { pesewasToInput, tryToPesewas } from '@/core/money/money';
import { listAccounts } from '@/features/accounts/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { daysAgo, parseDateTime, toDateInput, toTimeInput } from '@/lib/dates';
import { BrandMark } from '@/ui/BrandMark';
import { DateField, TimeField } from '@/ui/DateField';
import { AppText, Button, Chip, Field } from '@/ui/kit';
import { SelectField } from '@/ui/SelectField';
import { space } from '@/ui/theme';

export type TransferFormOutput = {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  fee: number;
  note: string | null;
  occurredAt: string;
};

export function TransferForm({
  initial,
  submitLabel = 'Move money',
  onSubmit,
}: {
  initial?: {
    fromAccountId?: number | null;
    toAccountId?: number | null;
    amount?: number;
    fee?: number;
    note?: string | null;
    occurredAt?: string;
  };
  submitLabel?: string;
  onSubmit: (values: TransferFormOutput) => void;
}) {
  const money = useFormatMoney();
  const accounts = useMemo(() => listAccounts(), []);
  const startIso = initial?.occurredAt ?? new Date().toISOString();

  const [fromId, setFromId] = useState<number | null>(initial?.fromAccountId ?? accounts[0]?.id ?? null);
  const [toId, setToId] = useState<number | null>(
    initial?.toAccountId ?? accounts.find((a) => a.id !== (initial?.fromAccountId ?? accounts[0]?.id))?.id ?? null,
  );
  const [amount, setAmount] = useState(initial?.amount != null ? pesewasToInput(initial.amount) : '');
  const [fee, setFee] = useState(initial?.fee != null && initial.fee > 0 ? pesewasToInput(initial.fee) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(toDateInput(startIso));
  const [time, setTime] = useState(toTimeInput(startIso));
  const [error, setError] = useState<string | null>(null);

  const from = accounts.find((a) => a.id === fromId) ?? null;
  const to = accounts.find((a) => a.id === toId) ?? null;

  const accountOptions = accounts.map((a) => ({
    id: String(a.id),
    label: a.name,
    sublabel: `${a.kind === 'momo' ? 'MoMo' : a.kind === 'bank' ? 'Bank' : a.kind === 'cash' ? 'Cash' : 'Other'} · ${money.symbol} ${pesewasToInput(a.balance)}`,
    leading: <BrandMark brandId={a.brandId} size="sm" />,
  }));

  const submit = () => {
    const amountPesewas = tryToPesewas(amount);
    if (amountPesewas == null || amountPesewas <= 0) {
      setError('Enter how much to move.');
      return;
    }
    const feePesewas = fee.trim() ? tryToPesewas(fee) : 0;
    if (feePesewas == null || feePesewas < 0) {
      setError('Check the fee amount.');
      return;
    }
    if (accounts.length < 2) {
      setError('Add at least two wallets under Balances → Manage, then move money between them.');
      return;
    }
    if (fromId == null || toId == null) {
      setError('Choose which account to take from and which to send to.');
      return;
    }
    if (fromId === toId) {
      setError('Pick two different accounts.');
      return;
    }
    const occurredAt = parseDateTime(date, time);
    if (!occurredAt) {
      setError('Check the date and time.');
      return;
    }
    setError(null);
    onSubmit({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: amountPesewas,
      fee: feePesewas,
      note: note.trim() || null,
      occurredAt,
    });
  };

  if (accounts.length < 2) {
    return (
      <View style={{ gap: space.md }}>
        <AppText tone="soft">
          Transfers move money between your wallets without counting as spending. Add at least two accounts first
          (for example MoMo and bank, or MoMo and cash).
        </AppText>
        <AppText tone="out">You need two wallets under Balances → Manage before you can move money.</AppText>
      </View>
    );
  }

  return (
    <View style={{ gap: space.lg }}>
      <AppText tone="soft">
        Move money between your own wallets — bank to MoMo, MoMo to cash, and so on. This does not count as spent or
        received.
      </AppText>

      <SelectField
        label="From"
        placeholder="Choose account"
        sheetTitle="Take money from"
        options={accountOptions}
        value={fromId == null ? null : String(fromId)}
        onChange={(id) => {
          const next = Number(id);
          setFromId(next);
          if (toId === next) {
            setToId(accounts.find((a) => a.id !== next)?.id ?? null);
          }
        }}
      />

      <SelectField
        label="To"
        placeholder="Choose account"
        sheetTitle="Send money to"
        options={accountOptions}
        value={toId == null ? null : String(toId)}
        onChange={(id) => {
          const next = Number(id);
          setToId(next);
          if (fromId === next) {
            setFromId(accounts.find((a) => a.id !== next)?.id ?? null);
          }
        }}
      />

      {from && to ? (
        <AppText variant="caption" tone="soft">
          {from.name} → {to.name}
        </AppText>
      ) : null}

      <Field
        label={`Amount (${money.symbol})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        icon="swap-horizontal-outline"
      />
      <Field
        label={`Fee on From account (${money.symbol}), if any`}
        value={fee}
        onChangeText={setFee}
        keyboardType="decimal-pad"
        placeholder="0.00"
        hint="MoMo send fees leave the From wallet. Leave blank if none."
      />

      <View style={{ gap: 8 }}>
        <AppText variant="label">When</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            label="Today"
            selected={date === toDateInput(new Date().toISOString())}
            onPress={() => setDate(toDateInput(new Date().toISOString()))}
          />
          <Chip
            label="Yesterday"
            selected={date === toDateInput(daysAgo(1))}
            onPress={() => setDate(toDateInput(daysAgo(1)))}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}>
            <DateField label="Date" value={date} onChange={setDate} />
          </View>
          <View style={{ flex: 1 }}>
            <TimeField label="Time" value={time} onChange={setTime} />
          </View>
        </View>
      </View>

      <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional — e.g. salary sweep" />

      {error ? <AppText tone="out">{error}</AppText> : null}
      <Button title={submitLabel} onPress={submit} />
    </View>
  );
}
