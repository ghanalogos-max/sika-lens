import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useTheme } from '@/ui/theme';

import { CHART_THEME_META, isChartThemeId, type ChartThemeId } from './chartThemes';
import { usePremium } from './PremiumProvider';

const KEY = 'sikalens.chart.v1';

const ChartThemeContext = createContext<{
  stored: ChartThemeId;
  setTheme: (id: ChartThemeId) => void;
}>({ stored: 'lagoon', setTheme: () => {} });

export function ChartThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<ChartThemeId>('lagoon');

  useEffect(() => {
    void SecureStore.getItemAsync(KEY).then((value) => {
      if (isChartThemeId(value)) setStored(value);
    });
  }, []);

  const setTheme = useCallback((id: ChartThemeId) => {
    setStored(id);
    void SecureStore.setItemAsync(KEY, id);
  }, []);

  return <ChartThemeContext.Provider value={{ stored, setTheme }}>{children}</ChartThemeContext.Provider>;
}

/** Colours for the spending graph. Free stays on Lagoon, which follows light and dark mode. */
export function useChartTheme() {
  const t = useTheme();
  const { isPremium } = usePremium();
  const { stored, setTheme } = useContext(ChartThemeContext);
  const id: ChartThemeId = isPremium ? stored : 'lagoon';
  const meta = CHART_THEME_META[id];
  const line = id === 'lagoon' ? t.primary : meta.line;
  const forecast = id === 'lagoon' ? t.gold : meta.forecast;
  return { id, line, forecast, setTheme };
}
