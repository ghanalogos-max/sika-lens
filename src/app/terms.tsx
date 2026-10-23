import { Linking, View } from 'react-native';

import { APP_NAME, APP_OWNER, SUPPORT_EMAIL, TERMS_URL } from '@/features/about/brand';
import { AppText, Button, Card, Screen } from '@/ui/kit';
import { space } from '@/ui/theme';

export default function TermsScreen() {
  return (
    <Screen>
      <AppText variant="title">Terms of use</AppText>
      <AppText tone="soft">{APP_NAME} is published by {APP_OWNER}.</AppText>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">What the app is for</AppText>
        <AppText tone="soft">
          {APP_NAME} helps you track MoMo and bank money on your phone. It is not a bank, not a payment service, and not
          financial advice. Network and bank names and logos belong to their owners.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">MoMo and bank balances</AppText>
        <AppText tone="soft">
          Each wallet or bank account keeps an opening balance you set (the same idea as a bank book balance). Every
          recorded entry then adds or subtracts from that figure. Balances do not restart from zero when you add
          transactions.
        </AppText>
        <AppText tone="soft">
          For MoMo amounts to stay correct, paste or record every MoMo transaction for that wallet — sends, receives,
          cash-out, airtime, bills, and fees. If you skip a message, the wallet on this phone will not match your real
          MoMo balance. When a saved MoMo SMS includes a “balance after” line, that line updates the linked wallet.
        </AppText>
        <AppText tone="soft">
          Bank and cash wallets work the same way: set the opening balance, then log every movement so the total stays
          true.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Your responsibility</AppText>
        <AppText tone="soft">
          You are responsible for the accuracy of amounts you enter or import, for recording complete MoMo and bank
          history on this phone, for keeping your PIN and backup passphrase safe, and for any files you export or share.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Premium</AppText>
        <AppText tone="soft">
          Optional Premium features renew through Google Play or the App Store until you cancel in that store's
          subscription settings. Prices shown in the app may be listed in US dollars; the store charges in your local
          currency.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Availability</AppText>
        <AppText tone="soft">
          We aim to keep {APP_NAME} useful and reliable, but we do not guarantee uninterrupted service. Features may
          change as MoMo message formats and store rules change.
        </AppText>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Contact</AppText>
        <AppText tone="soft">{SUPPORT_EMAIL}</AppText>
        <AppText tone="soft">Also published at {TERMS_URL}</AppText>
        <Button title="Email support" variant="quiet" onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        <Button title="Open online" variant="quiet" onPress={() => void Linking.openURL(TERMS_URL)} />
      </Card>
    </Screen>
  );
}
