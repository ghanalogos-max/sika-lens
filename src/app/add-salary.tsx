import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { SalaryForm } from '@/features/salary/SalaryForm';
import { addTransaction, ensureSalaryCategoryId } from '@/features/transactions/repository';
import { AppText, Screen } from '@/ui/kit';

function combineNote(bankName: string | null, note: string | null): string | null {
  const parts = [bankName ? `Bank: ${bankName}` : null, note].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

export default function AddSalary() {
  const router = useRouter();

  return (
    <Screen>
      <AppText variant="title">Log salary</AppText>
      <SalaryForm
        onSubmit={(values) => {
          const categoryId = ensureSalaryCategoryId();
          const result = addTransaction(
            {
              amount: values.amount,
              fee: 0,
              direction: 'in',
              type: 'salary',
              network: values.network,
              counterparty: values.employer,
              categoryId,
              note: combineNote(values.bankName, values.note),
              occurredAt: values.occurredAt,
              source: 'manual',
              paymentChannel: values.paymentChannel,
              employer: values.employer,
            },
            { accountId: values.accountId },
          );
          if (!result.inserted) {
            Alert.alert('Could not save', 'Something went wrong saving this salary. Try again.');
            return;
          }
          router.back();
        }}
      />
    </Screen>
  );
}
