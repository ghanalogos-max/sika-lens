import { shiftMonth } from '@/lib/dates';
import { canAddWallet, canOpenMonth, smsCutoffIso, smsWithinFreeHistory } from './limits';

const NOW = new Date('2026-10-21T12:00:00.000Z');

describe('premium limits', () => {
  it('caps free wallets at 2', () => {
    expect(canAddWallet(1, false)).toBe(true);
    expect(canAddWallet(2, false)).toBe(false);
    expect(canAddWallet(5, true)).toBe(true);
  });

  it('keeps 30 days of imported SMS on the free plan', () => {
    expect(smsCutoffIso(true, NOW)).toBeNull();
    expect(smsWithinFreeHistory('2026-10-01T12:00:00.000Z', false, NOW)).toBe(true);
    expect(smsWithinFreeHistory('2026-09-01T12:00:00.000Z', false, NOW)).toBe(false);
    expect(smsWithinFreeHistory('2020-01-01T00:00:00.000Z', true, NOW)).toBe(true);
    expect(smsCutoffIso(false, new Date('2026-10-21T12:00:00.100Z'))).toBe(
      smsCutoffIso(false, new Date('2026-10-21T12:00:30.900Z')),
    );
  });

  it('opens only the current month for free', () => {
    expect(canOpenMonth('2026-10', false, NOW)).toBe(true);
    expect(canOpenMonth('2026-09', false, NOW)).toBe(false);
    expect(canOpenMonth('2025-01', true, NOW)).toBe(true);
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});
