import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { getTransaction, updateTransaction } from '@/features/transactions/repository';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { AppText, Screen } from '@/ui/kit';

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
