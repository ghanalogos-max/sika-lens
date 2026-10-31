import { Platform } from 'react-native';

import { approxExpiryDate, type PremiumPlan } from './pricing';
import {
  configureRevenueCat,
  purchasePlanOnStore,
  restorePurchasesOnStore,
  revenueCatApiKey,
  syncPremiumFromStore,
} from './revenueCat';
import { activatePremium, clearPremium, loadPremium, savePremium, type PremiumState } from './storage';

/**
 * Live store billing via RevenueCat + App Store / Play subscriptions.
 * Requires public SDK keys (see docs/APP_STORE.md) and products:
 * premium_weekly / premium_monthly / premium_annual.
 */
export const STORE_BILLING_LIVE = true;

export type BillingFailure =
  | 'coming_soon'
  | 'cancelled'
  | 'failed'
  | 'unavailable'
  | 'not_found';

export type BillingResult =
  | { ok: true; state: PremiumState; source: 'store' | 'dev' | 'local' }
  | { ok: false; reason: BillingFailure; message?: string };

export function storeDisplayName(): string {
  return Platform.OS === 'ios' ? 'App Store' : 'Google Play';
}

/** Human-readable status for the Premium screen. */
export function billingStatusLabel(): string {
  if (STORE_BILLING_LIVE) {
    if (!revenueCatApiKey() && (Platform.OS === 'ios' || Platform.OS === 'android')) {
      return 'Store billing misconfigured — missing RevenueCat API key';
    }
    return `Billed through ${storeDisplayName()}`;
  }
  if (__DEV__) return 'Store billing not live — dev unlock only';
  return `Coming soon — billed through ${storeDisplayName()}`;
}

/** Configure SDK and refresh local Premium mirror from the store. */
export async function refreshStorePremium(): Promise<PremiumState> {
  if (!STORE_BILLING_LIVE) return loadPremium();
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return loadPremium();
  try {
    await configureRevenueCat();
    return await syncPremiumFromStore();
  } catch {
    return loadPremium();
  }
}

/**
 * Purchase a plan.
 * - Live store: RevenueCat → StoreKit / Play Billing.
 * - Dev + not live: local SecureStore unlock for QA.
 * - Production + not live: coming_soon (no charge).
 */
export async function purchasePremium(plan: PremiumPlan): Promise<BillingResult> {
  if (STORE_BILLING_LIVE) {
    return purchaseWithStore(plan);
  }
  if (__DEV__) {
    const state = await activatePremium(plan);
    return { ok: true, state, source: 'dev' };
  }
  return {
    ok: false,
    reason: 'coming_soon',
    message: `Premium will be billed through ${storeDisplayName()} in a future update.`,
  };
}

/** Restore purchases from the store account (or reload local state in dev). */
export async function restorePremium(): Promise<BillingResult> {
  if (STORE_BILLING_LIVE) {
    return restoreWithStore();
  }
  if (__DEV__) {
    const state = await loadPremium();
    if (!state.active) {
      return {
        ok: false,
        reason: 'not_found',
        message: 'No local Premium to restore. Unlock a plan in this build first.',
      };
    }
    return { ok: true, state, source: 'dev' };
  }
  return {
    ok: false,
    reason: 'coming_soon',
    message: `Restore will work once ${storeDisplayName()} billing is live.`,
  };
}

/** Dev / support only — does not cancel a real store subscription. */
export async function clearLocalPremium(): Promise<void> {
  await clearPremium();
}

async function purchaseWithStore(plan: PremiumPlan): Promise<BillingResult> {
  const result = await purchasePlanOnStore(plan);
  if (result.ok) return { ok: true, state: result.state, source: 'store' };
  return { ok: false, reason: result.reason, message: result.message };
}

async function restoreWithStore(): Promise<BillingResult> {
  const result = await restorePurchasesOnStore();
  if (result.ok) return { ok: true, state: result.state, source: 'store' };
  return { ok: false, reason: result.reason, message: result.message };
}

/** Apply a successful store entitlement into local SecureStore mirror (offline gates). */
export async function mirrorStoreEntitlement(plan: PremiumPlan, expiresAtIso: string | null): Promise<PremiumState> {
  if (expiresAtIso) {
    return savePremium({ active: true, plan, expiresAt: expiresAtIso });
  }
  // Unknown expiry from store — use plan length as a conservative local mirror.
  return activatePremium(plan);
}

export function approxExpiryIso(plan: PremiumPlan): string {
  return approxExpiryDate(plan).toISOString();
}
