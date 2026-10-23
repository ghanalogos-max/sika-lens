import { convertMajor, type RatesSnapshot } from './rates';

const sample: RatesSnapshot = {
  base: 'USD',
  date: '2026-10-23',
  fetchedAt: Date.now(),
  rates: { USD: 1, GHS: 15.2, EUR: 0.92, GBP: 0.78, NGN: 1600, XOF: 600, XAF: 600 },
};

describe('convertMajor', () => {
  it('converts through the USD base snapshot', () => {
    expect(convertMajor(100, 'USD', 'GHS', sample)).toBeCloseTo(1520, 5);
    expect(convertMajor(1520, 'GHS', 'USD', sample)).toBeCloseTo(100, 5);
    expect(convertMajor(100, 'EUR', 'USD', sample)).toBeCloseTo(100 / 0.92, 5);
  });

  it('returns null for unknown currencies', () => {
    expect(convertMajor(10, 'USD', 'XYZ', sample)).toBeNull();
  });
});
