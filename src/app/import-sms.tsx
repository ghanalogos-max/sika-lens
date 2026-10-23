import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { parseMomoSms, type ParsedSms } from '@/core/parser';
import { preferMomoAccount } from '@/features/accounts/repository';
import { smsWithinFreeHistory } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/PremiumProvider';
import { addTransaction } from '@/features/transactions/repository';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { BrandMark } from '@/ui/BrandMark';
import { AppText, Button, Card, Field, Screen } from '@/ui/kit';
import { space } from '@/ui/theme';

const FAILURE_TEXT = {
  empty: 'Paste the message first.',
  no_amount: 'I could not find an amount like GHS 25.00 in that text. Paste the whole MoMo message.',
  multiple_messages: 'That looks like more than one message. Paste one message at a time.',
} as const;

export default function ImportSms() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedSms | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = () => {
    const result = parseMomoSms(text);
    if (!result.ok) {
      setParsed(null);
      setError(FAILURE_TEXT[result.reason]);
      return;
    }
    setError(null);
    setParsed(result.value);
  };

  const pasteFromClipboard = async () => {
    const clip = await Clipboard.getStringAsync();
    if (clip) {
      setText(clip);
      setParsed(null);
      setError(null);
    }
  };

  return (
    <Screen>
      <AppText tone="soft">
        Paste every MoMo confirmation for this wallet so the balance stays correct — same idea as updating a bank book.
        Your opening balance is kept; each message adds or subtracts (or sets the figure when the SMS shows balance after).
      </AppText>
      <Field
        label="MoMo message"
        value={text}
        onChangeText={(v) => {
          setText(v);
          setParsed(null);
        }}
        multiline
        numberOfLines={5}
        placeholder="Paste the SMS from MTN, Telecel or AirtelTigo here"
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="Paste" variant="quiet" onPress={pasteFromClipboard} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Read message" onPress={read} />
        </View>
      </View>

      {error && <AppText tone="out">{error}</AppText>}

      {parsed && !smsWithinFreeHistory(parsed.occurredAt ?? new Date().toISOString(), isPremium) && (
        <AppText tone="gold">
          This message is older than 30 days. The free plan does not keep it. Premium keeps your full MoMo history.
        </AppText>
      )}

      {parsed && (
        <>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <BrandMark network={parsed.network !== 'unknown' ? parsed.network : undefined} brandId={parsed.network === 'unknown' ? 'other' : undefined} />
              <AppText variant="label" tone={parsed.confidence >= 0.8 ? 'primary' : 'gold'} style={{ flex: 1 }}>
                {parsed.confidence >= 0.8
                  ? 'Check the details, then save.'
                  : 'I was not sure about some details. Please check every field.'}
              </AppText>
            </View>
          </Card>
          <TransactionForm
            // New key per parse so the form resets with the new values.
            key={`${parsed.externalRef ?? ''}-${parsed.amount}-${parsed.raw.length}`}
            submitLabel="Save transaction"
            initial={{
              amount: parsed.amount,
              fee: parsed.fee,
              type: parsed.type,
              network: parsed.network,
              counterparty: parsed.counterparty,
              note: parsed.note ?? undefined,
              occurredAt: parsed.occurredAt,
              paymentChannel: 'momo',
              fromSms: true,
              accountId: preferMomoAccount(parsed.network)?.id ?? null,
            }}
            onSubmit={(values) => {
              if (!smsWithinFreeHistory(values.occurredAt, isPremium)) {
                Alert.alert(
                  'Older than 30 days',
                  'The free plan keeps imported MoMo messages for 30 days. Premium keeps the full history.',
                  [
                    { text: 'Not now', style: 'cancel' },
                    { text: 'See Premium', onPress: () => router.push('/premium') },
                  ],
                );
                return;
              }
              const { accountId, ...tx } = values;
              const result = addTransaction(
                {
                  ...tx,
                  source: 'sms_paste',
                  externalRef: parsed.externalRef,
                  balanceAfter: parsed.balanceAfter,
                  rawSms: parsed.raw,
                  paymentChannel: tx.paymentChannel ?? 'momo',
                },
                { accountId },
              );
              if (result.inserted) router.back();
              else Alert.alert('Already saved', 'This message has the same transaction ID as one you saved before, so I did not add it twice.');
            }}
          />
        </>
      )}
    </Screen>
  );
}
