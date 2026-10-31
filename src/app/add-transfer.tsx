import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { addTransfer } from '@/features/transactions/repository';
import { TransferForm } from '@/features/transactions/TransferForm';
import { Screen } from '@/ui/kit';

export default function AddTransfer() {
  const router = useRouter();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Move money', presentation: 'modal' }} />
      <TransferForm
        onSubmit={(values) => {
          const result = addTransfer(values);
          if (!result.ok) {
            Alert.alert('Could not move money', result.reason);
            return;
          }
          router.back();
        }}
      />
    </Screen>
  );
}
