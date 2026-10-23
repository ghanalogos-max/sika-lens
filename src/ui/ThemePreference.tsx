import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'sikalens.theme';

export const ThemePreferenceContext = createContext<ThemePreference>('system');
export const SetThemePreferenceContext = createContext<(p: ThemePreference) => void>(() => {});

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}

export function useSetThemePreference() {
  return useContext(SetThemePreferenceContext);
}

function applyColorScheme(preference: ThemePreference) {
  // RN 0.82+ / Expo SDK 55+: null crashes Android (NPE in AppearanceModule).
  // "unspecified" follows the system theme.
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void SecureStore.getItemAsync(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
    });
  }, []);

  useEffect(() => {
    applyColorScheme(preference);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void SecureStore.setItemAsync(KEY, p);
  }, []);

  return (
    <ThemePreferenceContext.Provider value={preference}>
      <SetThemePreferenceContext.Provider value={setPreference}>{children}</SetThemePreferenceContext.Provider>
    </ThemePreferenceContext.Provider>
  );
}
