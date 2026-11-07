import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

import { APP_STORE_URL, PLAY_STORE_URL } from '@/features/about/brand';

const KEY = {
  firstOpen: 'sikalens.engagement.firstOpen.v1',
  openCount: 'sikalens.engagement.openCount.v1',
  reviewAsked: 'sikalens.engagement.reviewAsked.v1',
} as const;

/** Ask after enough opens and days — Apple/Google guidelines: not on a button, not spammy. */
const MIN_OPENS = 5;
const MIN_DAYS = 3;

export async function recordAppOpen(): Promise<void> {
  const now = Date.now();
  const first = await SecureStore.getItemAsync(KEY.firstOpen);
  if (!first) await SecureStore.setItemAsync(KEY.firstOpen, String(now));
  const count = Number((await SecureStore.getItemAsync(KEY.openCount)) ?? '0') + 1;
  await SecureStore.setItemAsync(KEY.openCount, String(count));
}

export async function maybeRequestReview(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if ((await SecureStore.getItemAsync(KEY.reviewAsked)) === '1') return false;

  const firstRaw = await SecureStore.getItemAsync(KEY.firstOpen);
  const opens = Number((await SecureStore.getItemAsync(KEY.openCount)) ?? '0');
  if (!firstRaw || opens < MIN_OPENS) return false;

  const days = (Date.now() - Number(firstRaw)) / (1000 * 60 * 60 * 24);
  if (days < MIN_DAYS) return false;

  try {
    // Optional native module — missing until the next native build.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StoreReview = require('expo-store-review') as typeof import('expo-store-review');
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      await SecureStore.setItemAsync(KEY.reviewAsked, '1');
      return true;
    }
  } catch {
    // Module not linked yet.
  }
  return false;
}

/** Settings “Rate SikaLens” — opens the store page (manual review path). */
export async function openStoreForReview(): Promise<void> {
  const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  await Linking.openURL(url);
}
