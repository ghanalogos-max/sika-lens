import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { setDisplayCurrency } from '@/core/money/money';

import { CURRENCIES, isCurrencyId, type CurrencyId } from './currencies';

const KEY = 'sikalens.currency.v1';

const CurrencyContext = createContext<{
  currency: CurrencyId;
  setCurrency: (id: CurrencyId) => void;
}>({ currency: 'GHS', setCurrency: () => {} });

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyId>('GHS');

  useEffect(() => {
    void SecureStore.getItemAsync(KEY).then((value) => {
      if (isCurrencyId(value)) {
        setCurrencyState(value);
        setDisplayCurrency(value);
      }
    });
  }, []);

  const setCurrency = useCallback((id: CurrencyId) => {
    setCurrencyState(id);
    setDisplayCurrency(id);
    void SecureStore.setItemAsync(KEY, id);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function currencyLabel(id: CurrencyId): string {
  return CURRENCIES[id].name;
}
