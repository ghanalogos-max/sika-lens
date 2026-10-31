import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import {
  deleteTransaction,
  getTransaction,
  getTransferPair,
  updateTransaction,
  updateTransfer,
} from '@/features/transactions/repository';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { TransferForm } from '@/features/transactions/TransferForm';
import { AppText, Button, Screen } from '@/ui/kit';

export default function EditTransaction() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const txId = Number(id);
  const tx = Number.isFinite(txId) ? getTransaction(txId) : null;

  if (!tx) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Edit transaction' }} />
        <AppText tone="out">That transaction was not found. It may have been deleted.</AppText>
      </Screen>
    );
  }

  if (tx.type === 'transfer' && tx.transferGroupId) {
    const pair = getTransferPair(tx.transferGroupId);
    if (!pair) {
      return (
        <Screen>
          <Stack.Screen options={{ title: 'Edit transfer' }} />
          <AppText tone="out">That transfer was not found. It may have been deleted.</AppText>
        </Screen>
      );
    }
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Edit transfer', presentation: 'modal' }} />
        <TransferForm
          submitLabel="Save transfer"
          initial={{
            fromAccountId: pair.out.accountId,
            toAccountId: pair.in.accountId,
            amount: pair.out.amount,
            fee: pair.out.fee,
            note: pair.out.note,
            occurredAt: pair.out.occurredAt,
          }}
          onSubmit={(values) => {
            const result = updateTransfer({ ...values, groupId: tx.transferGroupId! });
            if (!result.ok) {
              Alert.alert('Could not save', result.reason);
              return;
            }
            router.back();
          }}
        />
        <Button
          title="Remove transfer"
          variant="quiet"
          onPress={() => {
            Alert.alert('Remove transfer?', 'Both sides of this move will be deleted and balances updated.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  deleteTransaction(tx.id);
                  router.back();
                },
              },
            ]);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Edit transaction', presentation: 'modal' }} />
      <TransactionForm
        submitLabel="Save changes"
        initial={{
          amount: tx.amount,
          fee: tx.fee,
          type: tx.type,
          network: tx.network,
          counterparty: tx.counterparty,
          categoryId: tx.categoryId,
          note: tx.note ?? undefined,
          occurredAt: tx.occurredAt,
          paymentChannel: tx.paymentChannel,
          employer: tx.employer,
          accountId: tx.accountId,
        }}
        onSubmit={(values) => {
          const { accountId, ...rest } = values;
          const ok = updateTransaction(tx.id, { ...rest, accountId });
          if (!ok) {
            Alert.alert('Could not save', 'Something went wrong updating this transaction.');
            return;
          }
          router.back();
        }}
      />
    </Screen>
  );
}
