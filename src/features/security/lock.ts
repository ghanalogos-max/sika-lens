import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { isValidPin, lockoutSeconds } from './pin-rules';

/**
 * App lock. The PIN is never stored: only a salted SHA-256 hash, inside the phone's
 * secure storage (Android Keystore / iOS Keychain).
 *
 * This keeps casual snoopers out. It does NOT encrypt the database file itself.
 */
const KEY = {
  hash: 'sikalens.pin.hash',
  salt: 'sikalens.pin.salt',
  bio: 'sikalens.bio.enabled',
  fails: 'sikalens.pin.fails',
  until: 'sikalens.pin.lockeduntil',
} as const;

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const hashPin = (pin: string, salt: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY.hash)) !== null;
}

async function resetFailures() {
  await SecureStore.deleteItemAsync(KEY.fails);
  await SecureStore.deleteItemAsync(KEY.until);
}

export async function setPin(pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error('PIN must be exactly 4 digits');
  const salt = toHex(Crypto.getRandomBytes(16));
  await SecureStore.setItemAsync(KEY.salt, salt);
  await SecureStore.setItemAsync(KEY.hash, await hashPin(pin, salt));
  await resetFailures();
}

/** Turns the lock off completely. Callers must verify the PIN first. */
export async function removePin(): Promise<void> {
  for (const k of Object.values(KEY)) await SecureStore.deleteItemAsync(k);
}

export type VerifyResult = { ok: true } | { ok: false; blockedForSeconds: number };

export async function verifyPin(pin: string): Promise<VerifyResult> {
  const now = Date.now();
  const until = Number((await SecureStore.getItemAsync(KEY.until)) ?? 0);
  if (until > now) return { ok: false, blockedForSeconds: Math.ceil((until - now) / 1000) };

  const [hash, salt] = await Promise.all([SecureStore.getItemAsync(KEY.hash), SecureStore.getItemAsync(KEY.salt)]);
  if (hash && salt && (await hashPin(pin, salt)) === hash) {
    await resetFailures();
    return { ok: true };
  }

  const fails = Number((await SecureStore.getItemAsync(KEY.fails)) ?? 0) + 1;
  const wait = lockoutSeconds(fails);
  await SecureStore.setItemAsync(KEY.fails, String(fails));
  if (wait > 0) await SecureStore.setItemAsync(KEY.until, String(now + wait * 1000));
  return { ok: false, blockedForSeconds: wait };
}

// ---- fingerprint / face ----

export async function biometricsAvailable(): Promise<boolean> {
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY.bio)) === '1';
}

export async function setBiometricEnabled(on: boolean): Promise<void> {
  if (on) await SecureStore.setItemAsync(KEY.bio, '1');
  else await SecureStore.deleteItemAsync(KEY.bio);
}

/** True when the phone has any screen lock (PIN, pattern, password, or biometrics). */
export async function deviceLockAvailable(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/**
 * Forgotten-PIN recovery: the phone's own screen lock proves ownership,
 * so the phone PIN/pattern is allowed here (unlike everyday unlocking).
 */
export async function authenticateWithDevice(): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirm it is you to reset your SikaLens PIN',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return res.success;
}

/** The PIN stays the fallback, so the phone's own screen-lock PIN is not offered here. */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock SikaLens',
    cancelLabel: 'Use PIN',
    disableDeviceFallback: true,
  });
  return res.success;
}
