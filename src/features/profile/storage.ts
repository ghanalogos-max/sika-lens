import * as SecureStore from 'expo-secure-store';

const NAME_KEY = 'sikalens.profile.name';
const ENTERED_KEY = 'sikalens.entrance.v1';
const BALANCES_VISIBLE_KEY = 'sikalens.balances.visible.v1';

export async function loadProfileName(): Promise<string | null> {
  const name = await SecureStore.getItemAsync(NAME_KEY);
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

export async function saveProfileName(name: string | null): Promise<void> {
  const trimmed = name?.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(NAME_KEY);
    return;
  }
  await SecureStore.setItemAsync(NAME_KEY, trimmed.slice(0, 40));
}

/** Defaults to visible when unset. */
export async function loadBalancesVisible(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BALANCES_VISIBLE_KEY);
  return value !== '0';
}

export async function saveBalancesVisible(visible: boolean): Promise<void> {
  await SecureStore.setItemAsync(BALANCES_VISIBLE_KEY, visible ? '1' : '0');
}

export async function hasEntered(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ENTERED_KEY)) === '1';
}

export async function markEntered(): Promise<void> {
  await SecureStore.setItemAsync(ENTERED_KEY, '1');
}
