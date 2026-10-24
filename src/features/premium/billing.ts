import { Platform } from 'react-native';

import { daysForPlan, type PremiumPlan } from './pricing';
import { PREMIUM_PRODUCT_IDS, productIdForPlan } from './products';
import { activatePremium, clearPremium, loadPremium, savePremium, type PremiumState } from './storage';

/**
 * Flip to `true` only after Play + App Store subscription products exist and a real
 * IAP SDK (e.g. RevenueCat) is configured in `purchaseWithStore` / `restoreWithStore`.
 */
export const STORE_BILLING_LIVE = false;

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
  if (STORE_BILLING_LIVE) return `Billed through ${storeDisplayName()}`;
  if (__DEV__) return 'Store billing not live — dev unlock only';
  return `Coming soon — billed through ${storeDisplayName()}`;
}

/**
 * Purchase a plan.
 * - Live store: call `purchaseWithStore` (replace stub with RevenueCat / IAP).
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

/**
 * Placeholder for real IAP. Replace with RevenueCat `Purchases.purchasePackage`
 * (or react-native-iap) using `productIdForPlan(plan)` / `PREMIUM_PRODUCT_IDS`.
 */
async function purchaseWithStore(plan: PremiumPlan): Promise<BillingResult> {
  const productId = productIdForPlan(plan);
  void productId;
  void PREMIUM_PRODUCT_IDS;
  // Example shape after RevenueCat:
  // const { customerInfo } = await Purchases.purchasePackage(pkg);
  // if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) { ... }
  return {
    ok: false,
    reason: 'unavailable',
    message: 'Store billing flag is on but no IAP SDK is configured yet.',
  };
}

async function restoreWithStore(): Promise<BillingResult> {
  // Example: const info = await Purchases.restorePurchases();
  return {
    ok: false,
    reason: 'unavailable',
    message: 'Store billing flag is on but no IAP SDK is configured yet.',
  };
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
  const expires = new Date();
  expires.setDate(expires.getDate() + daysForPlan(plan));
  return expires.toISOString();
}
