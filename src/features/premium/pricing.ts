/**
 * SikaLens Premium store prices (USD list). The App Store / Play Store charge in the
 * user’s local currency at checkout.
 */
export type PremiumPlan = 'weekly' | 'monthly' | 'annual';

export const PREMIUM_PLANS: Record<
  PremiumPlan,
  {
    usdCents: number;
    labelUsd: string;
    period: string;
    title: string;
    blurb: string;
    badge?: string;
  }
> = {
  weekly: {
    usdCents: 99,
    labelUsd: '$0.99',
    period: '/ week',
    title: 'Weekly',
    blurb: 'Try it for a week. Cancel anytime.',
  },
  monthly: {
    usdCents: 199,
    labelUsd: '$1.99',
    period: '/ month',
    title: 'Monthly',
    blurb: 'Most flexible. Renews each month.',
  },
  annual: {
    usdCents: 1499,
    labelUsd: '$14.99',
    period: '/ year',
    title: 'Yearly',
    blurb: 'Best value — about 2 months free vs monthly.',
    badge: 'Save 37%',
  },
};

export function daysForPlan(plan: PremiumPlan): number {
  if (plan === 'weekly') return 7;
  if (plan === 'annual') return 365;
  return 30;
}

/** Calendar-accurate local mirror when the store omits expirationDate. */
export function approxExpiryDate(plan: PremiumPlan, from: Date = new Date()): Date {
  const expires = new Date(from.getTime());
  if (plan === 'weekly') expires.setDate(expires.getDate() + 7);
  else if (plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
  else expires.setMonth(expires.getMonth() + 1);
  return expires;
}

export function planTitle(plan: PremiumPlan | null): string {
  if (!plan) return 'Premium';
  return PREMIUM_PLANS[plan].title;
}
