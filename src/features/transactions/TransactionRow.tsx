import { useRouter } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import type { Transaction } from '@/core/db/schema';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { shortDate } from '@/lib/dates';
import { BrandMark } from '@/ui/BrandMark';
import { AppText, CategoryGlyph } from '@/ui/kit';
import { radius, useTheme } from '@/ui/theme';
import { deleteTransaction } from './repository';
import { CHANNEL_LABEL, NETWORK_LABEL, TYPE_LABEL } from './labels';

export function TransactionRow({ tx, categoryName }: { tx: Transaction; categoryName?: string }) {
  const t = useTheme();
  const router = useRouter();
  const money = useFormatMoney();
  const incoming = tx.direction === 'in';
  const title =
    tx.type === 'salary'
      ? tx.employer ?? tx.counterparty ?? 'Salary'
      : tx.type === 'expense' && categoryName
        ? categoryName
        : (tx.counterparty ?? TYPE_LABEL[tx.type]);

  const bankFromNote = tx.note?.match(/^Bank:\s*([^·]+)/)?.[1]?.trim() ?? null;
  const channelLabel =
    bankFromNote ??
    (tx.paymentChannel ? CHANNEL_LABEL[tx.paymentChannel] : null);

  const meta = [
    shortDate(tx.occurredAt),
    tx.type === 'salary' ? 'Salary' : tx.type === 'expense' ? (tx.counterparty ?? 'Expense') : (categoryName ?? TYPE_LABEL[tx.type]),
    channelLabel,
    tx.network !== 'unknown' ? NETWORK_LABEL[tx.network] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const markBrandId =
    tx.paymentChannel === 'cash'
      ? 'cash'
      : tx.paymentChannel === 'bank'
        ? 'gcb'
        : undefined;

  const openEdit = () => router.push({ pathname: '/edit-transaction', params: { id: String(tx.id) } });

  const confirmActions = () =>
    Alert.alert(title, money.format(tx.amount), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: openEdit },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTransaction(tx.id),
      },
    ]);

  return (
    <Pressable
      onPress={openEdit}
      onLongPress={confirmActions}
      accessibilityHint="Tap to edit. Long press for edit or delete."
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        gap: 12,
        borderRadius: radius.sm,
        backgroundColor: pressed ? t.primarySoft : 'transparent',
      })}>
      {categoryName ? (
        <CategoryGlyph name={categoryName} size={18} />
      ) : (
        <BrandMark
          network={tx.network !== 'unknown' ? tx.network : undefined}
          brandId={tx.network === 'unknown' ? (markBrandId ?? 'other') : undefined}
          size="sm"
        />
      )}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" tone="soft">
          {meta}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', maxWidth: '42%', flexShrink: 0 }}>
        <AppText variant="label" tone={incoming ? 'in' : 'out'}>
          {incoming ? '+' : '−'}
          {money.format(tx.amount)}
        </AppText>
        {tx.fee > 0 && (
          <AppText variant="caption" tone="soft">
            fee {money.format(tx.fee)}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}
