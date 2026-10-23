import { useMemo, useState } from 'react';
import { View } from 'react-native';

import type { Account } from '@/core/db/schema';
import { pesewasToInput, tryToPesewas } from '@/core/money/money';
import type { Network, PaymentChannel } from '@/core/parser/types';
import { listAccounts } from '@/features/accounts/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { daysAgo, parseDateTime, toDateInput, toTimeInput } from '@/lib/dates';
import { BrandMark } from '@/ui/BrandMark';
import { brandById } from '@/ui/brands';
import { CHANNEL_ICONS } from '@/ui/categoryIcons';
import { AppText, Button, Chip, Field } from '@/ui/kit';
import { SelectField } from '@/ui/SelectField';
import { radius, space, useTheme } from '@/ui/theme';
import { BankPicker, bankBrandIdForMark, resolveBankName } from './BankPicker';
import { EmployerPicker, resolveEmployer } from './EmployerPicker';
import { MomoPicker } from './MomoPicker';

export type SalaryFormOutput = {
  amount: number;
  paymentChannel: PaymentChannel;
  employer: string;
  /** Full bank name when paid through bank (e.g. "GCB Bank"). */
  bankName: string | null;
  network: Network;
  accountId: number;
  note: string | null;
  occurredAt: string;
};

const CHANNELS: { id: PaymentChannel; label: string }[] = [
  { id: 'bank', label: 'Bank' },
  { id: 'momo', label: 'MoMo' },
  { id: 'cash', label: 'Cash' },
  { id: 'other', label: 'Other' },
];

export function SalaryForm({
  submitLabel = 'Save salary',
  onSubmit,
}: {
  submitLabel?: string;
  onSubmit: (values: SalaryFormOutput) => void;
}) {
  const t = useTheme();
  const money = useFormatMoney();
  const accounts = useMemo(() => listAccounts(), []);
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState<PaymentChannel>('bank');
  const [bankId, setBankId] = useState('gcb');
  const [customBank, setCustomBank] = useState('');
  const [employer, setEmployer] = useState<string>('Ghana Education Service');
  const [customEmployer, setCustomEmployer] = useState('');
  const [network, setNetwork] = useState<Network>('unknown');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const startIso = useMemo(() => new Date().toISOString(), []);
  const [date, setDate] = useState(toDateInput(startIso));
  const [time, setTime] = useState(toTimeInput(startIso));
  const [error, setError] = useState<string | null>(null);

  const bankName = channel === 'bank' ? resolveBankName(bankId, customBank) : null;

  const pickChannel = (c: PaymentChannel) => {
    setChannel(c);
    if (c !== 'momo') setNetwork('unknown');
  };

  const pickAccount = (a: Account) => {
    setAccountId(a.id);
    const brand = brandById(a.brandId);
    if (a.kind === 'momo') setChannel('momo');
    else if (a.kind === 'bank') setChannel('bank');
    else if (a.kind === 'cash') setChannel('cash');
    else setChannel('other');
    if (brand.network) setNetwork(brand.network);
    else if (a.syncNetwork && a.syncNetwork !== 'unknown') setNetwork(a.syncNetwork);
    else if (a.kind !== 'momo') setNetwork('unknown');
    if (brand.kind === 'bank') {
      setBankId(a.brandId);
      setCustomBank('');
    }
  };

  const submit = () => {
    const amountPesewas = tryToPesewas(amount);
    if (!amountPesewas || amountPesewas <= 0) {
      setError('Enter your salary amount, for example 3500.00.');
      return;
    }
    const employerName = resolveEmployer(employer, customEmployer);
    if (!employerName) {
      setError('Choose or type who pays you (Ghana Education Service, Ghana Health Service, your company, …).');
      return;
    }
    if (accounts.length === 0) {
      setError('Add a wallet first, then choose which account receives this salary.');
      return;
    }
    if (accountId == null) {
      setError('Choose which account receives this salary.');
      return;
    }
    if (channel === 'bank' && !bankName) {
      setError('Pick a bank, or choose "Another bank" and type the name.');
      return;
    }
    if (channel === 'momo' && network === 'unknown') {
      setError('Pick which MoMo network paid the salary (MTN, Telecel or AirtelTigo).');
      return;
    }
    const occurredAt = parseDateTime(date, time);
    if (!occurredAt) {
      setError('Check the date and time. Use the format 2026-10-20 and 14:30 (24-hour).');
      return;
    }
    setError(null);
    onSubmit({
      amount: amountPesewas,
      paymentChannel: channel,
      employer: employerName,
      bankName,
      network: channel === 'momo' ? network : 'unknown',
      accountId,
      note: note.trim() || null,
      occurredAt,
    });
  };

  const previewChannel =
    channel === 'bank' && bankName
      ? bankName
      : channel === 'momo' && network !== 'unknown'
        ? network.toUpperCase()
        : CHANNELS.find((c) => c.id === channel)?.label;

  return (
    <View style={{ gap: space.lg }}>
      <AppText tone="soft">
        Log pay from work — Ghana Education Service, Ghana Health Service, self-employment, or a private job — and where it landed.
      </AppText>

      <Field
        label={`Salary amount (${money.symbol})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        icon="wallet-outline"
        hint="What landed in your account this payday"
      />

      {accounts.length === 0 ? (
        <AppText tone="out">
          Add a wallet under Balances → Manage, then choose which account receives this salary.
        </AppText>
      ) : (
        <SelectField
          label="Account"
          placeholder="Choose an account"
          sheetTitle="Which account receives this salary?"
          options={accounts.map((a) => ({
            id: String(a.id),
            label: a.name,
            sublabel: `${a.kind === 'momo' ? 'MoMo' : a.kind === 'bank' ? 'Bank' : a.kind === 'cash' ? 'Cash' : 'Other'} · ${money.symbol} ${pesewasToInput(a.balance)}`,
            leading: <BrandMark brandId={a.brandId} size="sm" />,
          }))}
          value={accountId == null ? null : String(accountId)}
          onChange={(id) => {
            const a = accounts.find((w) => String(w.id) === id);
            if (a) pickAccount(a);
          }}
        />
      )}

      <View style={{ gap: space.sm }}>
        <AppText variant="label">Paid through</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CHANNELS.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              icon={CHANNEL_ICONS[c.id]}
              selected={channel === c.id}
              onPress={() => pickChannel(c.id)}
            />
          ))}
        </View>
      </View>

      {channel === 'bank' && (
        <BankPicker
          bankId={bankId}
          customName={customBank}
          onChange={(id, name) => {
            setBankId(id);
            setCustomBank(name);
          }}
        />
      )}

      {channel === 'momo' && <MomoPicker network={network} onChange={setNetwork} />}

      <EmployerPicker
        employer={employer}
        customName={customEmployer}
        onChange={(e, name) => {
          setEmployer(e);
          setCustomEmployer(name);
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          padding: space.md,
          borderRadius: radius.md,
          backgroundColor: t.primarySoft,
        }}>
        <BrandMark
          brandId={
            channel === 'momo'
              ? network !== 'unknown'
                ? network
                : 'other'
              : channel === 'bank'
                ? bankBrandIdForMark(bankId)
                : channel === 'cash'
                  ? 'cash'
                  : 'other'
          }
          size="md"
        />
        <View style={{ flex: 1 }}>
          <AppText variant="label">{resolveEmployer(employer, customEmployer)}</AppText>
          <AppText variant="caption" tone="soft">
            via {previewChannel}
          </AppText>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="label">Pay date</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Today" selected={date === toDateInput(new Date().toISOString())} onPress={() => setDate(toDateInput(new Date().toISOString()))} />
          <Chip label="Yesterday" selected={date === toDateInput(daysAgo(1))} onPress={() => setDate(toDateInput(daysAgo(1)))} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}>
            <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Time (24h)" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
      </View>

      <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional — e.g. October pay" />

      {error && <AppText tone="out">{error}</AppText>}
      <Button title={submitLabel} onPress={submit} />
    </View>
  );
}
