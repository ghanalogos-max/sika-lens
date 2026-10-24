import * as SecureStore from 'expo-secure-store';

import { daysForPlan, type PremiumPlan } from './pricing';

const KEY = 'sikalens.premium.v1';

export type PremiumState = {
  active: boolean;
  plan: PremiumPlan | null;
  /** ISO expiry; null if not subscribed */
  expiresAt: string | null;
};

const INACTIVE: PremiumState = { active: false, plan: null, expiresAt: null };

function isPlan(value: unknown): value is PremiumPlan {
  return value === 'weekly' || value === 'monthly' || value === 'annual';
}

export async function loadPremium(): Promise<PremiumState> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return INACTIVE;
  try {
    const parsed = JSON.parse(raw) as PremiumState;
    if (!parsed.expiresAt) return INACTIVE;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      await SecureStore.deleteItemAsync(KEY);
      return INACTIVE;
    }
    return {
      active: true,
      plan: isPlan(parsed.plan) ? parsed.plan : 'monthly',
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return INACTIVE;
  }
}

export async function activatePremium(plan: PremiumPlan): Promise<PremiumState> {
  const expires = new Date();
  expires.setDate(expires.getDate() + daysForPlan(plan));
  return savePremium({
    active: true,
    plan,
    expiresAt: expires.toISOString(),
  });
}

/** Persist an already-known entitlement (e.g. from the store / RevenueCat). */
export async function savePremium(state: PremiumState): Promise<PremiumState> {
  if (!state.active || !state.expiresAt) {
    await clearPremium();
    return INACTIVE;
  }
  await SecureStore.setItemAsync(KEY, JSON.stringify(state));
  return {
    active: true,
    plan: isPlan(state.plan) ? state.plan : 'monthly',
    expiresAt: state.expiresAt,
  };
}

export async function clearPremium(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
