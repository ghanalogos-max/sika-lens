import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, Share, Switch, View } from 'react-native';

import {
  APP_NAME,
  APP_OWNER,
  APP_STORE_URL,
  PLAY_STORE_URL,
  PRIVACY_URL,
  PUBLISHER_URL,
  SHARE_MESSAGE,
  SITE_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
} from '@/features/about/brand';
import { BackupPanel } from '@/features/backup/BackupPanel';
import { CurrencyPicker } from '@/features/currency/CurrencyPicker';
import { useCurrency } from '@/features/currency/CurrencyProvider';
import { BACKDROP_THEME_IDS, BACKDROP_WASH } from '@/features/premium/backdropThemes';
import { useBackdropTheme } from '@/features/premium/BackdropTheme';
import { useChartTheme } from '@/features/premium/ChartTheme';
import { CHART_THEME_IDS } from '@/features/premium/chartThemes';
import { usePremium } from '@/features/premium/PremiumProvider';
import { loadProfileName, saveProfileName } from '@/features/profile/storage';
import {
  biometricsAvailable,
  isBiometricEnabled,
  removePin,
  setBiometricEnabled,
  setPin,
  verifyPin,
} from '@/features/security/lock';
import { useLock } from '@/features/security/LockProvider';
import { isWeakPin } from '@/features/security/pin-rules';
import { PinPrompt } from '@/features/security/PinPrompt';
import { AppText, Button, Card, Chip, Field, Screen } from '@/ui/kit';
import { useSetThemePreference, useThemePreference, type ThemePreference } from '@/ui/ThemePreference';
import { radius, space, useTheme } from '@/ui/theme';

type Mode = 'idle' | 'new' | 'confirm' | 'verify-for-off' | 'verify-for-change' | 'backup';

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function Settings() {
  const router = useRouter();
  const t = useTheme();
  const themePreference = useThemePreference();
  const setThemePreference = useSetThemePreference();
  const { currency, setCurrency } = useCurrency();
  const { id: backdropId, stored: backdropStored, setBackdrop } = useBackdropTheme();
  const chart = useChartTheme();
  const { isPremium } = usePremium();
  const { pinSet, refresh, lock } = useLock();
  const [mode, setMode] = useState<Mode>('idle');
  const firstPin = useRef('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    void loadProfileName().then((saved) => setName(saved ?? ''));
  }, []);

  const loadBio = useCallback(async () => {
    setBioAvailable(await biometricsAvailable());
    setBioOn(await isBiometricEnabled());
  }, []);
  useEffect(() => {
    loadBio();
  }, [loadBio, pinSet]);

  const verifyThen = (next: Mode | 'off') => async (pin: string) => {
    const res = await verifyPin(pin);
    if (!res.ok) {
      return res.blockedForSeconds > 0
        ? `Too many wrong tries. Wait ${res.blockedForSeconds} seconds.`
        : 'That PIN is not right.';
    }
    if (next === 'off') {
      await removePin();
      await refresh();
      setMode('idle');
    } else {
      setMode(next);
    }
    return null;
  };

  if (mode !== 'idle') {
    return (
      <Screen>
        {mode === 'verify-for-off' && (
          <PinPrompt title="Turn off the lock" hint="Enter your current PIN." onSubmit={verifyThen('off')} onCancel={() => setMode('idle')} />
        )}
        {mode === 'verify-for-change' && (
          <PinPrompt title="Change your PIN" hint="Enter your current PIN first." onSubmit={verifyThen('new')} onCancel={() => setMode('idle')} />
        )}
        {mode === 'new' && (
          <PinPrompt
            title="Choose a PIN"
            hint="Exactly 4 digits. Pick something others can't guess."
            onCancel={() => setMode('idle')}
            onSubmit={(pin) => {
              if (isWeakPin(pin)) return 'That PIN is too easy to guess. Choose another.';
              firstPin.current = pin;
              setMode('confirm');
              return null;
            }}
          />
        )}
        {mode === 'backup' && <BackupPanel onClose={() => setMode('idle')} />}
        {mode === 'confirm' && (
          <PinPrompt
            title="Enter it again"
            submitLabel="Save PIN"
            onCancel={() => setMode('idle')}
            onSubmit={async (pin) => {
              if (pin !== firstPin.current) return 'The two PINs are different. Try again.';
              await setPin(pin);
              firstPin.current = '';
              await refresh();
              setMode('idle');
              return null;
            }}
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Settings</AppText>

      <Card>
        <AppText variant="label">Look</AppText>
        <AppText tone="soft">Choose light, dark, or follow the phone setting.</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {THEME_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={themePreference === opt.id}
              onPress={() => setThemePreference(opt.id)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <AppText tone="soft">
          How amounts are labelled — cedi, dollar, euro, pound, CFA, naira, and more. Figures stay the same; only the
          symbol changes.
        </AppText>
        <CurrencyPicker label="Currency" value={currency} onChange={setCurrency} sheetTitle="Choose currency" />
        <Button title="Live currency converter" variant="quiet" onPress={() => router.push('/convert')} />
      </Card>

      <Card>
        <AppText variant="label">Theme & graph colour</AppText>
        <AppText tone="soft">
          {isPremium
            ? 'Tap a colour for the app background and Insights graph. Lagoon is free; the rest are Premium.'
            : 'Tap Lagoon anytime. Other colours need Premium — tapping one opens the plans.'}
        </AppText>
        <View style={{ gap: space.sm }}>
          {BACKDROP_THEME_IDS.map((themeId) => {
            const meta = BACKDROP_WASH[themeId];
            const locked = !meta.free && !isPremium;
            // Free always shows Lagoon as active; Premium shows the saved choice.
            const selected = backdropId === themeId;
            const status = selected ? 'Selected' : locked ? 'Premium' : meta.free ? 'Free' : meta.blurb;
            return (
              <Pressable
                key={themeId}
                accessibilityRole="button"
                accessibilityLabel={`${meta.name} background${locked ? ', Premium' : ''}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  if (locked) {
                    router.push('/premium');
                    return;
                  }
                  setBackdrop(themeId);
                  if (CHART_THEME_IDS.includes(themeId as (typeof CHART_THEME_IDS)[number])) {
                    chart.setTheme(themeId as (typeof CHART_THEME_IDS)[number]);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  paddingVertical: 12,
                  paddingHorizontal: space.md,
                  borderRadius: radius.md,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? t.primary : t.line,
                  backgroundColor: selected ? t.primarySoft : t.surface,
                  opacity: locked ? 0.75 : 1,
                }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: meta.swatch,
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? t.ink : t.line,
                    flexShrink: 0,
                  }}
                />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <AppText variant="label">{meta.name}</AppText>
                  <AppText variant="caption" tone="soft">
                    {status}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" tone="soft">
          Active: {BACKDROP_WASH[backdropId].name}
          {!isPremium && backdropStored !== 'lagoon'
            ? `. Your Premium pick (${BACKDROP_WASH[backdropStored].name}) applies when Premium is on.`
            : ''}
        </AppText>
      </Card>

      <Card solid style={{ backgroundColor: isPremium ? t.goldSoft : t.surface, borderColor: isPremium ? t.gold : t.line }}>
        <AppText variant="label" tone={isPremium ? 'gold' : 'ink'}>
          {isPremium ? 'SikaLens Premium' : 'Go Premium'}
        </AppText>
        <AppText tone="soft">
          {isPremium
            ? 'Full history, unlimited wallets, earlier months, background themes, and export.'
            : 'From $0.99 / week, $1.99 / month, or $14.99 / year (about GHS). Logos and moving phones stay free.'}
        </AppText>
        <Button
          title={isPremium ? 'Manage Premium' : 'See Premium plans'}
          variant={isPremium ? 'quiet' : 'gold'}
          onPress={() => router.push('/premium')}
        />
      </Card>

      <Card>
        <AppText variant="label">Your name</AppText>
        <AppText tone="soft">Shown on Home. It travels inside a backup when you change phones. It is not a login.</AppText>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Optional"
          autoCapitalize="words"
          icon="person-outline"
          hint="Shown in the Home greeting"
        />
        <Button
          title="Save name"
          variant="quiet"
          onPress={() => {
            void saveProfileName(name);
            Alert.alert('Saved', name.trim() ? `Home will say hello to ${name.trim()}.` : 'Home will show SikaLens.');
          }}
        />
      </Card>

      <Card>
        <AppText variant="label">Wallets & banks</AppText>
        <AppText tone="soft">MTN, Telecel, AirtelTigo and Ghana bank balances on Home.</AppText>
        <Button title="Manage balances" variant="quiet" onPress={() => router.push('/accounts')} />
      </Card>

      <Card>
        <AppText variant="label">App lock</AppText>
        <AppText tone="soft">
          {pinSet
            ? 'SikaLens asks for your PIN when you open it and after you have been away for a short while.'
            : 'Protect your money records with a PIN.'}
        </AppText>
        {pinSet ? (
          <>
            {bioAvailable && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                <AppText>Unlock with fingerprint or face</AppText>
                <Switch
                  value={bioOn}
                  onValueChange={async (on) => {
                    await setBiometricEnabled(on);
                    setBioOn(on);
                  }}
                />
              </View>
            )}
            <Button title="Log out now" onPress={lock} />
            <Button title="Change PIN" variant="quiet" onPress={() => setMode('verify-for-change')} />
            <Button title="Turn off lock" variant="quiet" onPress={() => setMode('verify-for-off')} />
            <AppText variant="caption" tone="soft">
              Log out locks SikaLens and asks for your PIN again. Forgot your PIN? Use Forgot PIN on the lock screen to
              confirm with your phone lock and set a new one — or erase app data if you need a full reset. Export a backup
              regularly.
            </AppText>
          </>
        ) : (
          <Button title="Set a PIN" onPress={() => setMode('new')} />
        )}
      </Card>

      <Card>
        <AppText variant="label">Export</AppText>
        <AppText tone="soft">
          {isPremium
            ? 'PDF statement or Excel (CSV). Pick this month, a custom date range, or everything.'
            : 'CSV and PDF statements are part of Premium.'}
        </AppText>
        <Button
          title="Export PDF or Excel"
          variant="quiet"
          onPress={() => (isPremium ? router.push('/export') : router.push('/premium'))}
        />
      </Card>

      <Card>
        <AppText variant="label">Move to a new phone</AppText>
        <AppText tone="soft">
          Create an encrypted backup here, send the file to the new phone, and open SikaLens there. The passphrase is the only way in. SikaLens does not keep an account or a copy.
        </AppText>
        <Button title="Back up or restore" variant="quiet" onPress={() => setMode('backup')} />
      </Card>

      <Card>
        <AppText variant="label">Share {APP_NAME}</AppText>
        <AppText tone="soft">Send a friend the website and store links.</AppText>
        <Button
          title="Share app"
          variant="quiet"
          onPress={() => {
            void Share.share({ message: SHARE_MESSAGE, title: APP_NAME }).catch(() => {
              Alert.alert('Could not share', 'Try again, or open the website from About.');
            });
          }}
        />
        <Button title="Open website" variant="quiet" onPress={() => void Linking.openURL(SITE_URL)} />
        <Button title="Open Google Play" variant="quiet" onPress={() => void Linking.openURL(PLAY_STORE_URL)} />
        <Button title="Open App Store" variant="quiet" onPress={() => void Linking.openURL(APP_STORE_URL)} />
      </Card>

      <Card>
        <AppText variant="label">Legal</AppText>
        <AppText tone="soft">How we handle your data, and the terms for using {APP_NAME}.</AppText>
        <Button title="Privacy" variant="quiet" onPress={() => router.push('/privacy')} />
        <Button title="Terms of use" variant="quiet" onPress={() => router.push('/terms')} />
        <Button title="Privacy online" variant="quiet" onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <Button title="Terms online" variant="quiet" onPress={() => void Linking.openURL(TERMS_URL)} />
      </Card>

      <Card>
        <AppText variant="label">About</AppText>
        <AppText tone="soft">
          {APP_NAME} is made by {APP_OWNER}. Version {Constants.expoConfig?.version ?? '1.0.0'}.
        </AppText>
        <AppText variant="caption" tone="soft">
          {SITE_URL}
        </AppText>
        <AppText variant="caption" tone="soft">
          {SUPPORT_EMAIL}
        </AppText>
        <Button title="Open SikaLens website" variant="quiet" onPress={() => void Linking.openURL(SITE_URL)} />
        <Button
          title="Celestial Web Solutions"
          variant="quiet"
          onPress={() => void Linking.openURL(PUBLISHER_URL)}
        />
        <Button title="Email support" variant="quiet" onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Card>

      <AppText variant="caption" tone="soft" style={{ textAlign: 'center' }}>
        {APP_NAME} · {APP_OWNER}
      </AppText>
    </Screen>
  );
}
