import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { type PremiumPlan } from './pricing';
import { activatePremium, clearPremium, loadPremium, type PremiumState } from './storage';

type Ctx = {
  ready: boolean;
  isPremium: boolean;
  plan: PremiumPlan | null;
  expiresAt: string | null;
  subscribe: (plan: PremiumPlan) => Promise<void>;
  refresh: () => Promise<void>;
  /** Dev / support only */
  cancel: () => Promise<void>;
};

const PremiumContext = createContext<Ctx>({
  ready: false,
  isPremium: false,
  plan: null,
  expiresAt: null,
  subscribe: async () => {},
  refresh: async () => {},
  cancel: async () => {},
});

export function usePremium() {
  return useContext(PremiumContext);
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

  const subscribe = useCallback(async (plan: PremiumPlan) => {
    setState(await activatePremium(plan));
  }, []);

  const cancel = useCallback(async () => {
    await clearPremium();
    setState({ active: false, plan: null, expiresAt: null });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      isPremium: state.active,
      plan: state.plan,
      expiresAt: state.expiresAt,
      subscribe,
      refresh,
      cancel,
    }),
    [ready, state, subscribe, refresh, cancel],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}
