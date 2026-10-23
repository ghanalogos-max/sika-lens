import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import type { Account } from '@/core/db/schema';
import { pesewasToInput, tryToPesewas } from '@/core/money/money';
import {
  addAccount,
  archiveAccount,
  listAccounts,
  totalBalances,
  updateAccount,
} from '@/features/accounts/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { FREE_WALLET_LIMIT, canAddWallet } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/PremiumProvider';
import {
  checkBalancesAgainstTransactions,
  reconcileBalancesFromTransactions,
  type BalanceCheckRow,
} from '@/features/transactions/repository';
import { BrandMark } from '@/ui/BrandMark';
import { BRANDS, brandById, type Brand } from '@/ui/brands';
import { AppText, Button, Card, Chip, Field, Screen } from '@/ui/kit';
import { SelectField } from '@/ui/SelectField';
import { radius, space, useTheme } from '@/ui/theme';

type Draft = {
  name: string;
  brandId: string;
  balanceText: string;
  syncSms: boolean;
};

const emptyDraft = (): Draft => ({
  name: '',
  brandId: 'mtn',
  balanceText: '',
  syncSms: true,
});

export default function AccountsScreen() {
  const t = useTheme();
  const router = useRouter();
  const money = useFormatMoney();
  const { isPremium } = usePremium();
  const [rows, setRows] = useState<Account[]>([]);
  const [editing, setEditing] = useState<Account | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [kindFilter, setKindFilter] = useState<'momo' | 'bank' | 'cash' | 'other'>('momo');
  const [checks, setChecks] = useState<BalanceCheckRow[]>([]);

  const load = useCallback(() => {
    setRows(listAccounts());
    setChecks(checkBalancesAgainstTransactions());
  }, []);
  useFocusEffect(load);

  const brands = useMemo(() => BRANDS.filter((b) => b.kind === kindFilter), [kindFilter]);
  const total = rows.reduce((s, a) => s + a.balance, 0);
  const sumQuery = totalBalances();
  const mismatches = checks.filter((c) => !c.matches);
  const totalMatchesSum = total === sumQuery;

  const openAdd = () => {
    if (!canAddWallet(rows.length, isPremium)) {
      Alert.alert(
        `Free plan keeps ${FREE_WALLET_LIMIT} wallets`,
        'Premium tracks every MoMo wallet and bank account you have.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'See Premium', onPress: () => router.push('/premium') },
        ],
      );
      return;
    }
    setEditing(null);
    setDraft(emptyDraft());
    setKindFilter('momo');
    setAdding(true);
  };

  const openEdit = (account: Account) => {
    const brand = brandById(account.brandId);
    setAdding(false);
    setEditing(account);
    setKindFilter(brand.kind);
    setDraft({
      name: account.name,
      brandId: account.brandId,
      balanceText: pesewasToInput(account.balance),
      syncSms: Boolean(account.syncNetwork && account.syncNetwork !== 'unknown'),
    });
  };

  const pickBrand = (b: Brand) => {
    setDraft((d) => ({
      ...d,
      brandId: b.id,
      name: d.name.trim() ? d.name : b.name,
      syncSms: b.kind === 'momo' ? d.syncSms : false,
    }));
  };

  const save = () => {
    const balance = draft.balanceText.trim() ? tryToPesewas(draft.balanceText) : 0;
    if (balance === null) {
      Alert.alert('Check the balance', 'Enter an amount like 120.50');
      return;
    }
    const brand = brandById(draft.brandId);
    const name = draft.name.trim() || brand.name;
    const syncNetwork = draft.syncSms && brand.network ? brand.network : null;

    if (editing) {
      updateAccount(editing.id, {
        name,
        kind: brand.kind,
        brandId: brand.id,
        balance,
        syncNetwork,
      });
    } else {
      if (!canAddWallet(rows.length, isPremium)) {
        router.push('/premium');
        return;
      }
      addAccount({
        name,
        kind: brand.kind,
        brandId: brand.id,
        balance,
        syncNetwork,
      });
    }
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft());
    load();
  };

  const remove = (account: Account) => {
    Alert.alert('Remove this wallet?', account.name, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          archiveAccount(account.id);
          setEditing(null);
          load();
        },
      },
    ]);
  };

  const formOpen = adding || editing;

  return (
    <Screen>
      <AppText variant="title">Wallets & banks</AppText>
      <AppText tone="soft">
        Set an opening balance for each MoMo or bank wallet (like a bank book), then paste or record every transaction so
        the total stays correct. A MoMo SMS with a “balance after” line updates the linked wallet.
      </AppText>

      <Card>
        <AppText variant="caption" tone="soft">
          Total across wallets
        </AppText>
        <AppText variant="display">{money.format(total)}</AppText>
        {!totalMatchesSum && (
          <AppText variant="caption" tone="out">
            Total does not match the saved sum ({money.format(sumQuery)}). Pull to refresh or reopen this screen.
          </AppText>
        )}
      </Card>

      {!formOpen && mismatches.length > 0 && (
        <Card style={{ gap: space.sm }}>
          <AppText variant="label" tone="out">
            {mismatches.length === 1
              ? '1 MoMo wallet does not match its SMS balance lines'
              : `${mismatches.length} MoMo wallets do not match their SMS balance lines`}
          </AppText>
          {mismatches.map((c) => (
            <View key={c.accountId} style={{ gap: 2 }}>
              <AppText variant="label">{c.name}</AppText>
              <AppText variant="caption" tone="soft">
                Wallet {money.format(c.stored)}
                {c.fromTransactions != null ? ` · From MoMo SMS ${money.format(c.fromTransactions)}` : ''}
              </AppText>
            </View>
          ))}
          <AppText variant="caption" tone="soft">
            Opening balances for MoMo and bank stay as you set them. This check only uses MoMo “balance after” lines from
            messages you pasted or recorded — it does not restart wallets from zero. Paste every MoMo transaction so the
            figure stays true.
          </AppText>
          <Button
            title="Match wallets to MoMo SMS balances"
            onPress={() => {
              Alert.alert(
                'Update from MoMo SMS?',
                'Wallets with a saved MoMo balance line will be set to that figure (plus any entries after it). Opening balances without SMS balance lines are left alone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Update',
                    onPress: () => {
                      const n = reconcileBalancesFromTransactions();
                      load();
                      Alert.alert(
                        n === 0 ? 'Already matched' : 'Balances updated',
                        n === 0 ? 'Nothing needed changing.' : `${n} wallet${n === 1 ? '' : 's'} updated.`,
                      );
                    },
                  },
                ],
              );
            }}
          />
        </Card>
      )}

      {!formOpen && (
        <>
          {!isPremium && (
            <AppText variant="caption" tone="soft">
              Free plan: {Math.min(rows.length, FREE_WALLET_LIMIT)} of {FREE_WALLET_LIMIT} wallets
              {rows.length > FREE_WALLET_LIMIT ? ` (${rows.length} saved from Premium)` : ''}.
            </AppText>
          )}
          <Button title="Add wallet or bank" onPress={openAdd} />
          {rows.length === 0 ? (
            <Card>
              <AppText variant="label">No wallets yet</AppText>
              <AppText tone="soft">Add MTN MoMo, Telecel Cash, or your GCB / Ecobank account to see balances on Home.</AppText>
            </Card>
          ) : (
            rows.map((a) => {
              const check = checks.find((c) => c.accountId === a.id);
              const off = check && !check.matches;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => openEdit(a)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    backgroundColor: t.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: off ? t.moneyOut : t.line,
                    padding: space.lg,
                  }}>
                  <BrandMark brandId={a.brandId} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{a.name}</AppText>
                    <AppText variant="caption" tone="soft">
                      {brandById(a.brandId).name}
                      {off && check.fromTransactions != null
                        ? ` · SMS ${money.format(check.fromTransactions)}`
                        : check && check.netFromEntries !== 0
                          ? ` · net ${check.netFromEntries > 0 ? '+' : '−'}${money.format(Math.abs(check.netFromEntries))}`
                          : ''}
                    </AppText>
                  </View>
                  <AppText variant="label" tone={off ? 'out' : 'ink'}>
                    {money.format(a.balance)}
                  </AppText>
                </Pressable>
              );
            })
          )}
        </>
      )}

      {formOpen && (
        <Card>
          <AppText variant="label">{editing ? 'Edit wallet' : 'New wallet'}</AppText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(['momo', 'bank', 'cash', 'other'] as const).map((k) => (
              <Chip
                key={k}
                label={k === 'momo' ? 'MoMo' : k === 'bank' ? 'Bank' : k === 'cash' ? 'Cash' : 'Other'}
                selected={kindFilter === k}
                onPress={() => {
                  setKindFilter(k);
                  const first = BRANDS.find((b) => b.kind === k);
                  if (first) pickBrand(first);
                }}
              />
            ))}
          </ScrollView>

          <SelectField
            label={kindFilter === 'momo' ? 'MoMo network' : kindFilter === 'bank' ? 'Bank' : 'Type'}
            sheetTitle={kindFilter === 'bank' ? 'Choose bank' : 'Choose wallet'}
            options={brands.map((b) => ({
              id: b.id,
              label: b.name,
              sublabel: b.short !== b.name ? b.short : undefined,
              searchText: [b.name, b.short, ...(b.aliases ?? [])].join(' '),
              leading: <BrandMark brand={b} size="sm" />,
            }))}
            value={draft.brandId}
            onChange={(id) => pickBrand(brandById(id))}
          />

          <Field label="Display name" value={draft.name} onChangeText={(name) => setDraft((d) => ({ ...d, name }))} placeholder={brandById(draft.brandId).name} />
          <Field
            label={`Balance (${money.symbol})`}
            value={draft.balanceText}
            onChangeText={(balanceText) => setDraft((d) => ({ ...d, balanceText }))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {brandById(draft.brandId).network && (
            <Pressable
              onPress={() => setDraft((d) => ({ ...d, syncSms: !d.syncSms }))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: draft.syncSms ? t.primary : t.line,
                  backgroundColor: draft.syncSms ? t.primary : 'transparent',
                }}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="label">Update from MoMo SMS</AppText>
                <AppText variant="caption" tone="soft">
                  When you save a message with a balance for this network, overwrite this wallet.
                </AppText>
              </View>
            </Pressable>
          )}

          <Button title={editing ? 'Save changes' : 'Add wallet'} onPress={save} />
          <Button
            title="Cancel"
            variant="quiet"
            onPress={() => {
              setAdding(false);
              setEditing(null);
            }}
          />
          {editing && <Button title="Remove wallet" variant="quiet" onPress={() => remove(editing)} />}
        </Card>
      )}
    </Screen>
  );
}
