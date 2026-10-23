import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { addTransaction } from '@/features/transactions/repository';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { Screen } from '@/ui/kit';

export default function AddTransaction() {
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ title: kind === 'expense' ? 'Add an expense' : 'Add a transaction' }} />
      <TransactionForm
        initial={kind === 'expense' ? { type: 'expense' } : undefined}
        submitLabel={kind === 'expense' ? 'Save expense' : 'Save transaction'}
        onSubmit={(values) => {
          const { accountId, ...tx } = values;
          const result = addTransaction({ ...tx, source: 'manual' }, { accountId });
          if (result.inserted) router.back();
          else Alert.alert('Could not save', 'Something went wrong saving this transaction. Try again.');
        }}
      />
    </Screen>
  );
}
