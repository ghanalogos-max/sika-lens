import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useLock } from '@/features/security/LockProvider';
import { AppText, Button, Field } from '@/ui/kit';
import { space } from '@/ui/theme';
import { pickAndRestore, shareBackup } from './share';

const MIN = 8;

export function BackupPanel({ onClose }: { onClose: () => void }) {
  const { setPrompting } = useLock();
  const [mode, setMode] = useState<'choose' | 'create' | 'restore'>('choose');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (passphrase.length < MIN) {
      setError(`Use at least ${MIN} characters. You will need this exact passphrase to restore.`);
      return;
    }
    if (passphrase !== confirm) {
      setError('The two passphrases are different.');
      return;
    }
    setError(null);
    setBusy(true);
    setPrompting(true);
    try {
      const res = await shareBackup(passphrase);
      if (!res.ok) Alert.alert('Cannot share', 'This phone cannot open the share sheet.');
      else onClose();
    } catch {
      Alert.alert('Backup failed', 'Something went wrong creating the file. Try again.');
    } finally {
      setPrompting(false);
      setBusy(false);
    }
  };

  const restore = () => {
    if (passphrase.length < MIN) {
      setError(`Enter the passphrase you used, at least ${MIN} characters.`);
      return;
    }
    setError(null);
    Alert.alert('Replace the records on this phone?', 'Transactions, wallets, budgets and categories will match the backup. Your PIN stays as it is.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: () => void runRestore(),
      },
    ]);
  };

  const runRestore = async () => {
    setBusy(true);
    setPrompting(true);
    try {
      const res = await pickAndRestore(passphrase);
      if (res.ok) {
        Alert.alert('Restored', 'This phone now has the records from that backup.');
        onClose();
        return;
      }
      if (res.reason === 'cancelled') return;
      setError(res.reason === 'bad-passphrase' ? 'That passphrase does not open this backup.' : 'That file is not a SikaLens backup.');
    } finally {
      setPrompting(false);
      setBusy(false);
    }
  };

  if (mode === 'choose') {
    return (
      <View style={{ gap: space.sm }}>
        <AppText tone="soft">
          Send the file to your new phone, then restore it there with the same passphrase. SikaLens does not keep the passphrase or a copy of the file.
        </AppText>
        <Button title="Create a backup" onPress={() => setMode('create')} />
        <Button title="Restore from a backup" variant="quiet" onPress={() => setMode('restore')} />
        <Button title="Close" variant="quiet" onPress={onClose} />
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <AppText variant="label">{mode === 'create' ? 'Create a backup' : 'Restore a backup'}</AppText>
      <Field
        label="Passphrase"
        value={passphrase}
        onChangeText={setPassphrase}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="At least 8 characters"
      />
      {mode === 'create' && (
        <Field
          label="Passphrase again"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      {error && <AppText tone="out">{error}</AppText>}
      <Button
        title={busy ? 'Working…' : mode === 'create' ? 'Encrypt and share' : 'Choose backup file'}
        onPress={() => void (mode === 'create' ? create() : restore())}
        disabled={busy}
      />
      <Button title="Back" variant="quiet" onPress={() => setMode('choose')} />
    </View>
  );
}
