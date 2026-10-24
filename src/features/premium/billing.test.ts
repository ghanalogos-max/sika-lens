import { planFromProductId, PREMIUM_PRODUCT_IDS, productIdForPlan } from './products';

describe('premium products', () => {
  it('maps plans to stable store product ids', () => {
    expect(productIdForPlan('weekly')).toBe('premium_weekly');
    expect(productIdForPlan('monthly')).toBe('premium_monthly');
    expect(productIdForPlan('annual')).toBe('premium_annual');
    expect(Object.values(PREMIUM_PRODUCT_IDS)).toHaveLength(3);
  });

  it('resolves plan from product id', () => {
    expect(planFromProductId('premium_monthly')).toBe('monthly');
    expect(planFromProductId('unknown')).toBeNull();
  });
});
