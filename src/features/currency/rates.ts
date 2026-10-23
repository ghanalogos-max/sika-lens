import type { CurrencyId } from './currencies';
import { CURRENCY_IDS } from './currencies';

/** Live mid-market rates (no API key). Attribution required by the provider. */
export const RATES_API_URL = 'https://open.er-api.com/v6/latest';
export const RATES_PROVIDER = 'https://www.exchangerate-api.com';
export const RATES_DOCS = 'https://www.exchangerate-api.com/docs/free';

export type RatesSnapshot = {
  base: string;
  date: string;
  /** Units of quote per 1 unit of base. */
  rates: Record<string, number>;
  fetchedAt: number;
};

type ErApiResponse = {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

const CACHE_MS = 60 * 60 * 1000; // refresh at most hourly; provider updates daily
let cache: RatesSnapshot | null = null;
let inflight: Promise<RatesSnapshot> | null = null;

export async function fetchLiveRates(base: CurrencyId = 'USD', force = false): Promise<RatesSnapshot> {
  if (!force && cache && cache.base === base && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(`${RATES_API_URL}/${base}`);
    if (!res.ok) throw new Error(`Rates request failed (${res.status}).`);
    const data = (await res.json()) as ErApiResponse;
    if (data.result !== 'success' || !data.rates) throw new Error('Rates response was not usable.');
    const rates: Record<string, number> = { [base]: 1 };
    for (const id of CURRENCY_IDS) {
      if (typeof data.rates[id] === 'number') rates[id] = data.rates[id];
    }
    cache = {
      base,
      date: data.time_last_update_utc?.slice(0, 16) ?? new Date().toISOString().slice(0, 10),
      rates,
      fetchedAt: Date.now(),
    };
    return cache;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** Convert `amount` minor units… wait — converter uses major units (cedis/dollars). */
export function convertMajor(
  amount: number,
  from: string,
  to: string,
  snapshot: RatesSnapshot,
): number | null {
  if (!Number.isFinite(amount)) return null;
  const fromRate = snapshot.rates[from];
  const toRate = snapshot.rates[to];
  if (!fromRate || !toRate) return null;
  // snapshot.rates are relative to snapshot.base
  const inBase = amount / fromRate;
  return inBase * toRate;
}
