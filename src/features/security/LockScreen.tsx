import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { SUPPORT_EMAIL } from '@/features/about/brand';
import { eraseLedger } from '@/features/backup/snapshot';
import { GateFooter } from '@/features/entrance/GateFooter';
import { GateShell } from '@/features/entrance/GateShell';
import { loadProfileName } from '@/features/profile/storage';
import { lockGreeting } from '@/lib/dates';
import { AppText, Button } from '@/ui/kit';
import { fonts, radius, space, useTheme } from '@/ui/theme';
import {
  authenticateWithBiometrics,
  authenticateWithDevice,
  biometricsAvailable,
  deviceLockAvailable,
  isBiometricEnabled,
  removePin,
  setPin,
  verifyPin,
} from './lock';
import { useLock } from './LockProvider';
import { isValidPin, isWeakPin } from './pin-rules';
import { PinPrompt } from './PinPrompt';

type Step = 'landing' | 'pin' | 'forgot' | 'newPin' | 'confirmPin';

/** Covers the whole app while locked. Landing → Login → compact PIN page. */
export function LockScreen() {
  const t = useTheme();
  const { unlock, refresh, setPrompting } = useLock();
  const [bio, setBio] = useState(false);
  const [step, setStep] = useState<Step>('landing');
  const [hasDeviceLock, setHasDeviceLock] = useState(true);
  const [draftPin, setDraftPin] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  const tryBiometrics = useCallback(async () => {
    setPrompting(true);
    try {
      if (await authenticateWithBiometrics()) unlock();
    } finally {
      setPrompting(false);
    }
  }, [setPrompting, unlock]);

  useEffect(() => {
    void loadProfileName().then(setProfileName);
    (async () => {
      const usable = (await isBiometricEnabled()) && (await biometricsAvailable());
      setBio(usable);
      // Soft attempt on landing only — do not open the PIN page automatically.
      if (usable) tryBiometrics();
    })();
  }, [tryBiometrics]);

  const openForgot = async () => {
    setNotice(null);
    setHasDeviceLock(await deviceLockAvailable());
    setStep('forgot');
  };

  const verifyWithPhone = async () => {
    setPrompting(true);
    try {
      if (await authenticateWithDevice()) {
        setNotice(null);
        setStep('newPin');
      } else {
        setNotice('Could not confirm it is you. Try again.');
      }
    } finally {
      setPrompting(false);
    }
  };

  const confirmErase = () => {
    Alert.alert(
      'Erase SikaLens data?',
      'This deletes every transaction, account and budget on this phone and removes the PIN. Restore from a backup afterwards if you have one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you sure?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Erase everything',
                style: 'destructive',
                onPress: async () => {
                  eraseLedger();
                  await removePin();
                  await refresh();
                  unlock();
                },
              },
            ]),
        },
      ],
    );
  };

  const { hello, welcome, initial } = lockGreeting(profileName);
  const onLanding = step === 'landing';
  const onPin = step === 'pin';

  return (
    <GateShell
      line={onPin ? 'Enter your 4-digit PIN to continue.' : 'Unlock to open your MoMo and bank records.'}
      greeting={onLanding || onPin ? hello : null}
      welcome={onLanding || onPin ? welcome : null}
      initial={onLanding || onPin ? initial : null}
      compactSheet={onPin}
      zIndex={10}
      footer={
        onLanding ? (
          <GateFooter
            items={[
              { icon: 'phone-portrait-outline', label: 'On this phone' },
              { icon: 'cloud-offline-outline', label: 'Works offline' },
              { icon: 'lock-closed-outline', label: 'PIN protected' },
              { icon: 'wallet-outline', label: 'MoMo & banks' },
            ]}
          />
        ) : null
      }>
      {step === 'landing' && (
        <View style={{ gap: space.md }}>
          <View style={{ gap: 4 }}>
            <AppText variant="title" style={{ fontSize: 20 }}>
              Ready to open SikaLens
            </AppText>
            <AppText variant="caption" tone="soft">
              Sign in with your PIN, or use fingerprint / face if you turned that on.
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button title="Login" onPress={() => setStep('pin')} />
            </View>
            {bio ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use fingerprint or face"
                onPress={tryBiometrics}
                style={({ pressed }) => ({
                  width: 54,
                  height: 54,
                  borderRadius: radius.md,
                  backgroundColor: t.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                  shadowColor: t.primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                })}>
                <Ionicons name="finger-print" size={26} color={t.onPrimary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={openForgot}
            style={({ pressed }) => ({
              alignSelf: 'center',
              paddingVertical: 10,
              paddingHorizontal: space.lg,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: t.line,
              opacity: pressed ? 0.75 : 1,
            })}>
            <AppText variant="label" tone="primary" style={{ fontFamily: fonts.semibold }}>
              Forgot PIN?
            </AppText>
          </Pressable>
        </View>
      )}

      {step === 'pin' && (
        <PinPrompt
          key="pin"
          compact
          title="Enter your PIN"
          submitLabel="Login"
          onCancel={() => setStep('landing')}
          onSubmit={async (pin) => {
            const res = await verifyPin(pin);
            if (res.ok) {
              unlock();
              return null;
            }
            return res.blockedForSeconds > 0
              ? `Too many wrong tries. Wait ${res.blockedForSeconds} seconds and try again.`
              : 'That PIN is not right.';
          }}
        />
      )}

      {step === 'forgot' && (
        <View style={{ gap: space.md }}>
          <AppText variant="title" style={{ fontSize: 20 }}>
            Forgot your PIN?
          </AppText>
          {hasDeviceLock ? (
            <>
              <AppText tone="soft">
                Confirm it is you with this phone's screen lock, then choose a new SikaLens PIN. Your data stays as it
                is.
              </AppText>
              <Button title="Verify with phone lock" onPress={verifyWithPhone} />
            </>
          ) : (
            <AppText tone="soft">
              This phone has no screen lock, so SikaLens cannot confirm it is you. Turn on a screen lock in your phone
              settings and come back, or erase SikaLens data on this phone and start again.
            </AppText>
          )}
          {notice ? <AppText tone="out">{notice}</AppText> : null}
          <Button title="Erase data and start again" variant="quiet" onPress={confirmErase} />
          <AppText variant="caption" tone="soft">
            Need help? {SUPPORT_EMAIL}
          </AppText>
          <Button title="Back" variant="quiet" onPress={() => setStep('landing')} />
        </View>
      )}

      {step === 'newPin' && (
        <>
          <PinPrompt
            key="newPin"
            compact
            title="Choose a new PIN"
            hint="Exactly 4 digits. Avoid 1234 or repeats."
            onSubmit={(pin) => {
              if (!isValidPin(pin)) return 'Use exactly 4 digits.';
              if (isWeakPin(pin)) return 'That PIN is too easy to guess. Choose another.';
              setNotice(null);
              setDraftPin(pin);
              setStep('confirmPin');
              return null;
            }}
          />
          {notice ? <AppText tone="out">{notice}</AppText> : null}
        </>
      )}

      {step === 'confirmPin' && (
        <PinPrompt
          key="confirmPin"
          compact
          title="Type it once more"
          submitLabel="Save and unlock"
          onSubmit={async (pin) => {
            if (pin !== draftPin) {
              setDraftPin('');
              setNotice('The PINs did not match. Start again.');
              setStep('newPin');
              return null;
            }
            await setPin(pin);
            await refresh();
            unlock();
            return null;
          }}
          onCancel={() => setStep('newPin')}
        />
      )}
    </GateShell>
  );
}
