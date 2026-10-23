/**
 * SikaLens Premium store prices.
 * USD is the list price; GHS is an approximate display for Ghana (store bills in local currency).
 */
export type PremiumPlan = 'weekly' | 'monthly' | 'annual';

/** Rough cedi display rate for marketing copy (not a live FX feed). */
const GHS_PER_USD = 15.2;

export const PREMIUM_PLANS: Record<
  PremiumPlan,
  {
    usdCents: number;
    labelUsd: string;
    labelGhs: string;
    period: string;
    title: string;
    blurb: string;
    badge?: string;
  }
> = {
  weekly: {
    usdCents: 99,
    labelUsd: '$0.99',
    labelGhs: `GHS ${(0.99 * GHS_PER_USD).toFixed(2)}`,
    period: '/ week',
    title: 'Weekly',
    blurb: 'Try it for a week. Cancel anytime.',
  },
  monthly: {
    usdCents: 199,
    labelUsd: '$1.99',
    labelGhs: `GHS ${(1.99 * GHS_PER_USD).toFixed(2)}`,
    period: '/ month',
    title: 'Monthly',
    blurb: 'Most flexible. Renews each month.',
  },
  annual: {
    usdCents: 1499,
    labelUsd: '$14.99',
    labelGhs: `GHS ${(14.99 * GHS_PER_USD).toFixed(2)}`,
    period: '/ year',
    title: 'Yearly',
    blurb: 'Best value — about 2 months free vs monthly.',
    badge: 'Save 37%',
  },
};

/** @deprecated Use PREMIUM_PLANS[plan].usdCents — kept for older call sites. */
export const PREMIUM_MONTHLY_PESEWAS = Math.round(1.99 * GHS_PER_USD * 100);
export const PREMIUM_ANNUAL_PESEWAS = Math.round(14.99 * GHS_PER_USD * 100);

export function daysForPlan(plan: PremiumPlan): number {
  if (plan === 'weekly') return 7;
  if (plan === 'annual') return 365;
  return 30;
}

export function planTitle(plan: PremiumPlan | null): string {
  if (!plan) return 'Premium';
  return PREMIUM_PLANS[plan].title;
}
