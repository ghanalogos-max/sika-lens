import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  billingStatusLabel,
  clearLocalPremium,
  purchasePremium,
  restorePremium,
  STORE_BILLING_LIVE,
  storeDisplayName,
  type BillingResult,
} from './billing';
import { type PremiumPlan } from './pricing';
import { loadPremium, type PremiumState } from './storage';

type Ctx = {
  ready: boolean;
  isPremium: boolean;
  plan: PremiumPlan | null;
  expiresAt: string | null;
  storeBillingLive: boolean;
  storeName: string;
  billingLabel: string;
  purchase: (plan: PremiumPlan) => Promise<BillingResult>;
  restore: () => Promise<BillingResult>;
  refresh: () => Promise<void>;
  /** Dev / support only — does not cancel a real store subscription */
  cancel: () => Promise<void>;
  /** @deprecated Use `purchase` — kept for older call sites */
  subscribe: (plan: PremiumPlan) => Promise<void>;
};

const PremiumContext = createContext<Ctx>({
  ready: false,
  isPremium: false,
  plan: null,
  expiresAt: null,
  storeBillingLive: false,
  storeName: 'Google Play',
  billingLabel: '',
  purchase: async () => ({ ok: false, reason: 'unavailable' }),
  restore: async () => ({ ok: false, reason: 'unavailable' }),
  refresh: async () => {},
  cancel: async () => {},
  subscribe: async () => {},
});

export function usePremium() {
  return useContext(PremiumContext);
}

function applyState(setState: (s: PremiumState) => void, result: BillingResult): BillingResult {
  if (result.ok) setState(result.state);
  return result;
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PremiumState>({ active: false, plan: null, expiresAt: null });

  const refresh = useCallback(async () => {
    setState(await loadPremium());
  }, []);

  useEffect(() => {
    void loadPremium().then((s) => {
      setState(s);
      setReady(true);
    });
  }, []);

  const purchase = useCallback(async (plan: PremiumPlan) => {
    return applyState(setState, await purchasePremium(plan));
  }, []);

  const restore = useCallback(async () => {
    return applyState(setState, await restorePremium());
  }, []);

  const cancel = useCallback(async () => {
    await clearLocalPremium();
    setState({ active: false, plan: null, expiresAt: null });
  }, []);

  /** Legacy: unlock without surfacing BillingResult (dev flows). */
  const subscribe = useCallback(
    async (plan: PremiumPlan) => {
      const result = await purchase(plan);
      if (!result.ok && __DEV__) {
        // keep old throw-free behaviour
      }
    },
    [purchase],
  );

  const value = useMemo(
    () => ({
      ready,
      isPremium: state.active,
      plan: state.plan,
      expiresAt: state.expiresAt,
      storeBillingLive: STORE_BILLING_LIVE,
      storeName: storeDisplayName(),
      billingLabel: billingStatusLabel(),
      purchase,
      restore,
      refresh,
      cancel,
      subscribe,
    }),
    [ready, state, purchase, restore, refresh, cancel, subscribe],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}
