import { useMemo } from 'react';

import { formatMoney, maskGHS, currencySymbol } from '@/core/money/money';

import { useCurrency } from './CurrencyProvider';

/**
 * Subscribe to the currency preference so amounts re-render when the user switches
 * GH₵ / $ / € / ₦ in Settings.
 */
export function useFormatMoney() {
  const { currency } = useCurrency();
  return useMemo(
    () => ({
      currency,
      symbol: currencySymbol(currency),
      format: (value: number, opts?: { sign?: boolean }) => formatMoney(value, { ...opts, currency }),
      mask: (opts?: { signed?: '+' | '−' | null }) => maskGHS({ ...opts, currency }),
    }),
    [currency],
  );
}
