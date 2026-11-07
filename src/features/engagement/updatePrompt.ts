import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Alert, Linking, Platform } from 'react-native';

import { APP_STORE_URL, PLAY_STORE_URL, SITE_URL } from '@/features/about/brand';

const DISMISSED_KEY = 'sikalens.engagement.updateDismissed.v1';

type VersionManifest = {
  ios?: string;
  android?: string;
  message?: string;
};

function parseVersion(v: string): number[] {
  return v
    .trim()
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map((p) => Number(p) || 0);
}

/** true when remote is newer than local (semver-ish). */
export function isNewerVersion(remote: string, local: string): boolean {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

function localVersion(): string {
  return Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.0.0';
}

function storeUrl(): string {
  return Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
}

export type UpdateCheckResult =
  | { status: 'update'; local: string; remote: string; message: string }
  | { status: 'current'; local: string; remote: string }
  | { status: 'unknown'; local: string };

async function fetchRemoteVersion(): Promise<{ remote: string; message: string } | null> {
  try {
    const res = await fetch(`${SITE_URL}/app-version.json`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as VersionManifest;
    const remote = (Platform.OS === 'ios' ? data.ios : data.android)?.trim() ?? '';
    if (!remote) return null;
    const message =
      typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'A newer SikaLens build is on the store. Update to get the latest fixes and features.';
    return { remote, message };
  } catch {
    return null;
  }
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const local = localVersion();
  if (Platform.OS === 'web') return { status: 'unknown', local };
  const fetched = await fetchRemoteVersion();
  if (!fetched) return { status: 'unknown', local };
  if (isNewerVersion(fetched.remote, local)) {
    return { status: 'update', local, remote: fetched.remote, message: fetched.message };
  }
  return { status: 'current', local, remote: fetched.remote };
}

/**
 * Fetches website/app-version.json and prompts once per remote version when an update is live.
 */
export async function maybePromptAppUpdate(): Promise<UpdateCheckResult> {
  const result = await checkForAppUpdate();
  if (result.status !== 'update') return result;

  const dismissed = await SecureStore.getItemAsync(DISMISSED_KEY);
  if (dismissed === result.remote) return result;

  Alert.alert('Update available', result.message, [
    {
      text: 'Later',
      style: 'cancel',
      onPress: () => {
        void SecureStore.setItemAsync(DISMISSED_KEY, result.remote);
      },
    },
    {
      text: 'Update',
      onPress: () => {
        void SecureStore.setItemAsync(DISMISSED_KEY, result.remote);
        void Linking.openURL(storeUrl());
      },
    },
  ]);
  return result;
}

export async function openStoreForUpdate(): Promise<void> {
  await Linking.openURL(storeUrl());
}
