import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { pickAndRestore } from '@/features/backup/share';
import { CurrencyPicker } from '@/features/currency/CurrencyPicker';
import { useCurrency } from '@/features/currency/CurrencyProvider';
import { markEntered, saveProfileName } from '@/features/profile/storage';
import { useLock } from '@/features/security/LockProvider';
import { AppText, Button, Field } from '@/ui/kit';
import { radius, space, useTheme } from '@/ui/theme';

import { GateFooter } from './GateFooter';
import { GateShell } from './GateShell';
import { ledgerHasRecords } from './ledger';

/** First open on a phone — before the PIN lock. Name + currency for new users, or restore. */
export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { setPrompting } = useLock();
  const hasRecords = useMemo(() => ledgerHasRecords(), []);
  const [step, setStep] = useState<'choose' | 'restore'>('choose');
  const [name, setName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const softField = {
    backgroundColor: t.backgroundDeep,
    borderColor: t.line,
    borderRadius: radius.md,
  };

  const finish = async (profile: string | null) => {
    if (profile) await saveProfileName(profile);
    await markEntered();
    onDone();
  };

  const startFresh = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter the name Home should greet you with.');
      return;
    }
    setError(null);
    void finish(trimmed);
  };

  const restore = async () => {
    if (passphrase.trim().length < 8) {
      setError('Enter the passphrase from the old phone. It is at least 8 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    setPrompting(true);
    try {
      const res = await pickAndRestore(passphrase);
      if (res.ok) {
        await markEntered();
        onDone();
        return;
      }
      if (res.reason === 'cancelled') return;
      setError(res.reason === 'bad-passphrase' ? 'That passphrase does not open this backup.' : 'That file is not a SikaLens backup.');
    } finally {
      setPrompting(false);
      setBusy(false);
    }
  };

  return (
    <GateShell
      line="MoMo and bank money, kept on your phone — no cloud account required."
      zIndex={12}
      footer={
        <GateFooter
          items={[
            { icon: 'phone-portrait-outline', label: 'On device' },
            { icon: 'swap-horizontal-outline', label: 'MoMo & banks' },
            { icon: 'pie-chart-outline', label: 'Insights' },
            { icon: 'shield-checkmark-outline', label: 'Your PIN' },
          ]}
        />
      }>
      {step === 'choose' ? (
        hasRecords ? (
          <>
            <AppText variant="title" style={{ fontSize: 20 }}>
              Welcome back
            </AppText>
            <AppText tone="soft">This phone already has your records.</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['Wallets', 'Activity', 'Budgets'].map((chip) => (
                <View
                  key={chip}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    backgroundColor: t.primarySoft,
                  }}>
                  <AppText variant="caption" tone="primary">
                    {chip}
                  </AppText>
                </View>
              ))}
            </View>
            <Button title="Continue" onPress={() => void finish(null)} />
            <Button
              title="Replace with a backup"
              variant="quiet"
              onPress={() =>
                Alert.alert(
                  'Replace the records on this phone?',
                  'A backup from another phone will overwrite wallets, transactions, and budgets here.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Choose a backup', onPress: () => setStep('restore') },
                  ],
                )
              }
            />
          </>
        ) : (
          <>
            <View style={{ gap: 4 }}>
              <AppText variant="title" style={{ fontSize: 20 }}>
                New here
              </AppText>
              <AppText variant="caption" tone="soft">
                A name for greetings, and how amounts are labelled.
              </AppText>
            </View>
            <Field
              label="Your name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError(null);
              }}
              placeholder="Used in Good morning, …"
              autoCapitalize="words"
              icon="person-outline"
              style={softField}
            />
            <CurrencyPicker label="Currency" value={currency} onChange={setCurrency} sheetTitle="Choose currency" />
            <View style={{ gap: space.xs }}>
              <AppText variant="caption" tone="soft">
                You can add MTN, Telecel, AirtelTigo and Ghana banks next.
              </AppText>
            </View>
            {error ? <AppText tone="out">{error}</AppText> : null}
            <Button title="Start on this phone" onPress={startFresh} />
            <Button title="I already use SikaLens" variant="quiet" onPress={() => setStep('restore')} />
          </>
        )
      ) : (
        <>
          <View style={{ gap: 4 }}>
            <AppText variant="title" style={{ fontSize: 20 }}>
              Bring records across
            </AppText>
            <AppText tone="soft">
              On the old phone, open Settings → Move to a new phone, then enter that passphrase here.
            </AppText>
          </View>
          <Field
            label="Backup passphrase"
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="At least 8 characters"
            icon="key-outline"
            style={softField}
          />
          {error ? <AppText tone="out">{error}</AppText> : null}
          <Button title={busy ? 'Working…' : 'Choose backup file'} onPress={() => void restore()} disabled={busy} />
          <Button title="Back" variant="quiet" onPress={() => setStep('choose')} />
        </>
      )}
    </GateShell>
  );
}
