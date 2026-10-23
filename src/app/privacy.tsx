import { Linking, View } from 'react-native';

import { APP_NAME, APP_OWNER, PRIVACY_URL, PUBLISHER_URL, SUPPORT_EMAIL } from '@/features/about/brand';
import { AppText, Button, Card, Screen } from '@/ui/kit';
import { space } from '@/ui/theme';

export default function PrivacyScreen() {
  return (
    <Screen>
      <AppText variant="title">Privacy</AppText>
      <AppText tone="soft">Last updated for {APP_NAME} by {APP_OWNER}.</AppText>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">On your phone</AppText>
        <AppText tone="soft">
          Your wallets, transactions, budgets, and PIN stay on this device. {APP_NAME} does not create an account and does
          not upload your ledger to our servers.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Backups you choose</AppText>
        <AppText tone="soft">
          An encrypted backup is a file you create and share yourself. The passphrase is never stored by {APP_NAME}. The
          PIN is a one-way hash in the phone's secure storage and is not inside the backup.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Exports</AppText>
        <AppText tone="soft">
          CSV and PDF exports are files you save or share. They include the transactions you choose to export. Raw MoMo SMS
          text is never included in the CSV.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Store purchases</AppText>
        <AppText tone="soft">
          Optional Premium will be billed through Google Play or the App Store when store billing is live. Until then,
          in-app purchase is not charged. Those stores handle payment details under their own privacy policies.{' '}
          {APP_OWNER} does not receive your card number.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Contact</AppText>
        <AppText tone="soft">Questions about privacy: {SUPPORT_EMAIL}</AppText>
        <AppText tone="soft">Also published at {PRIVACY_URL}</AppText>
        <AppText tone="soft">Publisher: {APP_OWNER}</AppText>
        <Button title="Email support" variant="quiet" onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        <Button title="Open online" variant="quiet" onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <Button title="Celestial Web Solutions" variant="quiet" onPress={() => void Linking.openURL(PUBLISHER_URL)} />
      </Card>
    </Screen>
  );
}
