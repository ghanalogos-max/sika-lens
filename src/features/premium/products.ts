import type { PremiumPlan } from './pricing';

/**
 * Store product IDs — create the same IDs in Google Play Console and App Store Connect.
 * When wiring RevenueCat, map these products to entitlement `premium`.
 */
export const PREMIUM_PRODUCT_IDS: Record<PremiumPlan, string> = {
  weekly: 'premium_weekly',
  monthly: 'premium_monthly',
  annual: 'premium_annual',
};

export const PREMIUM_ENTITLEMENT_ID = 'premium';

export function planFromProductId(productId: string): PremiumPlan | null {
  const entry = Object.entries(PREMIUM_PRODUCT_IDS).find(([, id]) => id === productId);
  return entry ? (entry[0] as PremiumPlan) : null;
}

export function productIdForPlan(plan: PremiumPlan): string {
  return PREMIUM_PRODUCT_IDS[plan];
}
