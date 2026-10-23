import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { isBackdropThemeId, type BackdropThemeId } from './backdropThemes';
import { usePremium } from './PremiumProvider';

const KEY = 'sikalens.backdrop.v1';

const BackdropThemeContext = createContext<{
  stored: BackdropThemeId;
  setBackdrop: (id: BackdropThemeId) => void;
}>({ stored: 'lagoon', setBackdrop: () => {} });

export function BackdropThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<BackdropThemeId>('lagoon');

  useEffect(() => {
    void SecureStore.getItemAsync(KEY).then((value) => {
      if (isBackdropThemeId(value)) setStored(value);
    });
  }, []);

  const setBackdrop = useCallback((id: BackdropThemeId) => {
    setStored(id);
    void SecureStore.setItemAsync(KEY, id);
  }, []);

  return (
    <BackdropThemeContext.Provider value={{ stored, setBackdrop }}>{children}</BackdropThemeContext.Provider>
  );
}

/** Active background wash. Free stays on Lagoon; `stored` is what the user last chose. */
export function useBackdropTheme() {
  const { isPremium } = usePremium();
  const { stored, setBackdrop } = useContext(BackdropThemeContext);
  const id: BackdropThemeId = isPremium ? stored : 'lagoon';
  return { id, stored, setBackdrop, isPremium };
}
