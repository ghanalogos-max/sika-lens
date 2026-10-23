import { useMemo, useState } from 'react';
import { View } from 'react-native';

import type { Account, NewTransaction } from '@/core/db/schema';
import { pesewasToInput, tryToPesewas } from '@/core/money/money';
import { directionFor } from '@/core/parser/common';
import { NETWORKS, PAYMENT_CHANNELS, TX_TYPES, type Network, type PaymentChannel, type TxType } from '@/core/parser/types';
import { listAccounts, preferMomoAccount } from '@/features/accounts/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { BankPicker, resolveBankName } from '@/features/salary/BankPicker';
import { MomoPicker } from '@/features/salary/MomoPicker';
import { EmployerPicker, resolveEmployer } from '@/features/salary/EmployerPicker';
import { daysAgo, parseDateTime, toDateInput, toTimeInput } from '@/lib/dates';
import { BrandMark } from '@/ui/BrandMark';
import { brandById } from '@/ui/brands';
import { CHANNEL_ICONS, TYPE_ICONS } from '@/ui/categoryIcons';
import { AppText, Button, Chip, Field } from '@/ui/kit';
import { SelectField } from '@/ui/SelectField';
import { CategoryField } from './CategoryField';
import { CHANNEL_LABEL, NETWORK_LABEL, TYPE_LABEL } from './labels';
import { ensureSalaryCategoryId, listCategories, suggestCategoryId } from './repository';

/** What the form hands back. The caller adds source, externalRef, balanceAfter and rawSms. */
export type FormOutput = Pick<
  NewTransaction,
  | 'amount'
  | 'fee'
  | 'direction'
  | 'type'
  | 'network'
  | 'counterparty'
  | 'categoryId'
  | 'note'
  | 'occurredAt'
  | 'paymentChannel'
  | 'employer'
> & {
  /** Wallet to debit or credit — required when accounts exist. */
  accountId: number | null;
};

export interface FormInitial {
  amount?: number;
  fee?: number;
  type?: TxType;
  network?: Network;
  counterparty?: string | null;
  categoryId?: number | null;
  note?: string;
  occurredAt?: string | null;
  paymentChannel?: PaymentChannel | null;
  employer?: string | null;
  /** Pre-selected wallet (e.g. MoMo for a pasted SMS). */
  accountId?: number | null;
  /** When true, default Via to MoMo and pick the matching MoMo wallet. */
  fromSms?: boolean;
}

export function TransactionForm({
  initial = {},
  submitLabel,
  onSubmit,
}: {
  initial?: FormInitial;
  submitLabel: string;
  onSubmit: (values: FormOutput) => void;
}) {
  const money = useFormatMoney();
  const categories = useMemo(() => listCategories(), []);
  const accounts = useMemo(() => listAccounts(), []);
  const [amount, setAmount] = useState(initial.amount ? pesewasToInput(initial.amount) : '');
  const [fee, setFee] = useState(initial.fee ? pesewasToInput(initial.fee) : '');
  const [type, setType] = useState<TxType>(initial.type ?? 'send');
  const [network, setNetwork] = useState<Network>(initial.network ?? 'unknown');
  const [channel, setChannel] = useState<PaymentChannel | null>(() => {
    if (initial.paymentChannel) return initial.paymentChannel;
    if (initial.fromSms) return 'momo';
    if (initial.type === 'expense') return 'momo';
    return null;
  });
  const [employer, setEmployer] = useState(initial.employer ?? 'Ghana Education Service');
  const [customEmployer, setCustomEmployer] = useState('');
  const [bankId, setBankId] = useState('gcb');
  const [customBank, setCustomBank] = useState('');
  const [counterparty, setCounterparty] = useState(initial.counterparty ?? '');
  const [note, setNote] = useState(initial.note ?? '');
  const [accountId, setAccountId] = useState<number | null>(() => {
    if (initial.accountId != null) return initial.accountId;
    if (initial.fromSms || initial.paymentChannel === 'momo' || (initial.network && initial.network !== 'unknown')) {
      return preferMomoAccount(initial.network ?? 'unknown')?.id ?? null;
    }
    return null;
  });
  const [categoryId, setCategoryId] = useState<number | null>(() => {
    if (initial.categoryId !== undefined) return initial.categoryId;
    const suggested = suggestCategoryId(initial.counterparty);
    if (suggested != null) return suggested;
    if (initial.type === 'expense') {
      return categories.find((c) => c.name === 'Food & groceries')?.id ?? null;
    }
    return null;
  });
  const startIso = useMemo(() => initial.occurredAt ?? new Date().toISOString(), [initial.occurredAt]);
  const [date, setDate] = useState(toDateInput(startIso));
  const [time, setTime] = useState(toTimeInput(startIso));
  const [error, setError] = useState<string | null>(null);

  const pickAccount = (a: Account) => {
    setAccountId(a.id);
    const brand = brandById(a.brandId);
    if (a.kind === 'momo' || a.kind === 'bank' || a.kind === 'cash' || a.kind === 'other') {
      setChannel(a.kind === 'momo' ? 'momo' : a.kind === 'bank' ? 'bank' : a.kind === 'cash' ? 'cash' : 'other');
    }
    if (brand.network) setNetwork(brand.network);
    else if (a.syncNetwork && a.syncNetwork !== 'unknown') setNetwork(a.syncNetwork);
    else if (a.kind !== 'momo') setNetwork('unknown');
    if (brand.kind === 'bank') {
      setBankId(a.brandId);
      setCustomBank('');
    }
  };

  const pickType = (next: TxType) => {
    setType(next);
    if (next === 'salary') {
      setCategoryId(ensureSalaryCategoryId());
      if (!channel) setChannel('bank');
    }
    if (next === 'expense') {
      if (!channel) setChannel('momo');
      if (categoryId == null) {
        const food = categories.find((c) => c.name === 'Food & groceries');
        if (food) setCategoryId(food.id);
      }
    }
  };

  const pickChannel = (c: PaymentChannel) => {
    setChannel(c);
    if (c === 'momo' && network === 'unknown') setNetwork('mtn');
    if (c !== 'momo') setNetwork('unknown');
    if (accountId != null) {
      const selected = accounts.find((a) => a.id === accountId);
      if (selected && selected.kind !== c && !(c === 'other')) {
        const match =
          c === 'momo'
            ? accounts.find((a) => a.kind === 'momo')
            : c === 'bank'
              ? accounts.find((a) => a.kind === 'bank')
              : c === 'cash'
                ? accounts.find((a) => a.kind === 'cash')
                : accounts[0];
        if (match) pickAccount(match);
        else setAccountId(null);
      }
    }
  };

  const submit = () => {
    const amountPesewas = tryToPesewas(amount);
    if (!amountPesewas || amountPesewas <= 0) {
      setError('Enter an amount greater than zero, for example 25.00.');
      return;
    }
    const feePesewas = fee.trim() ? tryToPesewas(fee) : 0;
    if (feePesewas === null) {
      setError('The fee is not a valid amount. Leave it empty if there was no fee.');
      return;
    }
    const occurredAt = parseDateTime(date, time);
    if (!occurredAt) {
      setError('Check the date and time. Use the format 2026-10-20 and 14:30 (24-hour).');
      return;
    }

    let employerName: string | null = null;
    let party = counterparty.trim() || null;
    let resolvedChannel = channel;
    let resolvedNetwork = network;
    let resolvedCategory = categoryId;

    if (type === 'salary') {
      employerName = resolveEmployer(employer, customEmployer);
      if (!employerName) {
        setError('Choose who pays you (Ghana Education Service, Ghana Health Service, self-employed, …).');
        return;
      }
      party = employerName;
      resolvedChannel = channel ?? 'bank';
      resolvedCategory = resolvedCategory ?? ensureSalaryCategoryId();
      if (resolvedChannel === 'bank' && !resolveBankName(bankId, customBank)) {
        setError('Pick a bank, or choose "Another bank" and type the name.');
        return;
      }
      if (resolvedChannel === 'momo' && resolvedNetwork === 'unknown') {
        setError('Pick which MoMo network paid the salary.');
        return;
      }
      if (resolvedChannel !== 'momo') resolvedNetwork = 'unknown';
    } else {
      if (type === 'expense' && !resolvedCategory) {
        setError('Choose a category for this expense, for example Food or Transport.');
        return;
      }
      if (channel === 'bank') {
        resolvedNetwork = 'unknown';
        const bankName = resolveBankName(bankId, customBank);
        if (!bankName) {
          setError('Pick a bank, or choose "Another bank" and type the name.');
          return;
        }
        if (!party) party = bankName;
      } else if (channel === 'momo' && resolvedNetwork === 'unknown') {
        setError('Pick MTN, Telecel or AirtelTigo for a MoMo payment.');
        return;
      }
    }

    if (accounts.length === 0) {
      setError('Add a MoMo or bank wallet first, then choose it for this entry.');
      return;
    }
    if (accountId == null) {
      setError('Choose which account this entry is for.');
      return;
    }

    const bankName = channel === 'bank' || (type === 'salary' && (channel ?? 'bank') === 'bank')
      ? resolveBankName(bankId, customBank)
      : null;
    const noteParts = [bankName ? `Bank: ${bankName}` : null, note.trim() || null].filter(Boolean);

    setError(null);
    onSubmit({
      amount: amountPesewas,
      fee: feePesewas,
      direction: directionFor(type),
      type,
      network: resolvedNetwork,
      counterparty: party,
      categoryId: resolvedCategory,
      note: noteParts.length ? noteParts.join(' · ') : null,
      occurredAt,
      paymentChannel: resolvedChannel,
      employer: employerName,
      accountId,
    });
  };

  const showChannel = type === 'salary' || type === 'expense' || type === 'receive' || type === 'send' || type === 'cash_in' || type === 'other';
  return (
    <View style={{ gap: 16 }}>
      <Field
        label={`Amount (${money.symbol})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        icon="cash-outline"
        hint="Enter the full amount of this transfer"
      />
      {type !== 'salary' && (
        <Field label={`Network fee (${money.symbol}), if any`} value={fee} onChangeText={setFee} keyboardType="decimal-pad" placeholder="0.00" />
      )}

      {type !== 'salary' && (
        accounts.length === 0 ? (
          <AppText tone="out">
            Add a wallet under Balances → Manage, then come back and choose it for this entry.
          </AppText>
        ) : (
          <SelectField
            label={initial.fromSms ? 'MoMo wallet' : 'Account'}
            placeholder={initial.fromSms ? 'Choose MoMo wallet' : 'Choose an account'}
            sheetTitle={initial.fromSms ? 'Which MoMo wallet? (or another account)' : 'Which account?'}
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
        )
      )}
      {initial.fromSms && accountId != null && (
        <AppText variant="caption" tone="soft">
          Matched to your MoMo wallet for this network. Tap above to use a different account.
        </AppText>
      )}

      <SelectField
        label="What happened"
        options={TX_TYPES.map((x) => ({ id: x, label: TYPE_LABEL[x], icon: TYPE_ICONS[x] }))}
        value={type}
        onChange={(id) => pickType(id as TxType)}
      />

      {type === 'expense' && (
        <CategoryField
          label="Expense category"
          value={categoryId}
          onChange={setCategoryId}
          required
          allowNone={false}
        />
      )}

      {showChannel && (
        <View style={{ gap: 8 }}>
          <AppText variant="label">{type === 'salary' ? 'Paid through' : 'Via'}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PAYMENT_CHANNELS.map((c) => (
              <Chip
                key={c}
                label={CHANNEL_LABEL[c]}
                icon={CHANNEL_ICONS[c]}
                selected={channel === c}
                onPress={() => pickChannel(c)}
              />
            ))}
          </View>
        </View>
      )}

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

      {channel === 'momo' && (
        <MomoPicker
          network={network}
          onChange={(n) => {
            setNetwork(n);
            const sync = accounts.find((a) => a.syncNetwork === n);
            if (sync) setAccountId(sync.id);
          }}
        />
      )}

      {!channel && type !== 'salary' && (
        <SelectField
          label="MoMo network"
          options={NETWORKS.map((x) => ({
            id: x,
            label: NETWORK_LABEL[x],
            leading: <BrandMark brandId={x === 'unknown' ? 'other' : x} size="sm" />,
          }))}
          value={network}
          onChange={(id) => setNetwork(id as Network)}
        />
      )}

      {type === 'salary' ? (
        <EmployerPicker
          employer={employer}
          customName={customEmployer}
          onChange={(e, name) => {
            setEmployer(e);
            setCustomEmployer(name);
          }}
        />
      ) : (
        <Field
          label={type === 'expense' ? 'Shop or person' : directionFor(type) === 'in' ? 'From (name or number)' : 'To (name or number)'}
          value={counterparty}
          onChangeText={setCounterparty}
          onEndEditing={() => {
            if (categoryId === null) setCategoryId(suggestCategoryId(counterparty));
          }}
          autoCapitalize="words"
        />
      )}

      {type !== 'expense' && (
        <CategoryField label="Category" value={categoryId} onChange={setCategoryId} />
      )}

      <View style={{ gap: 8 }}>
        <AppText variant="label">When</AppText>
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

      <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />

      {error && <AppText tone="out">{error}</AppText>}
      <Button title={submitLabel} onPress={submit} />
    </View>
  );
}
