import { useContext } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { BACKDROP_WASH } from '@/features/premium/backdropThemes';
import { useBackdropTheme } from '@/features/premium/BackdropTheme';

import { ThemePreferenceContext } from './ThemePreference';

/**
 * Lagoon primary, cedi gold accent — money colours that stay readable in both modes.
 * Backdrop washes (Premium) override background and accent soft colours.
 */
export const palette = {
  light: {
    /** Cool bank-light canvas — warmth lives in accents, not the page wash. */
    background: '#F7F9FA',
    backgroundDeep: '#EEF2F4',
    surface: '#FFFFFF',
    surfaceRaised: '#FCFDFD',
    ink: '#1C2430',
    inkSoft: '#5C6770',
    line: '#E2E8EC',
    primary: '#0E6A62',
    primarySoft: '#E3F3F0',
    onPrimary: '#FFFFFF',
    gold: '#A86B12',
    goldSoft: '#F8EDD8',
    onGold: '#FFFFFF',
    moneyIn: '#1C8A56',
    moneyOut: '#D4533E',
    ringGlow: 'rgba(14, 106, 98, 0.12)',
  },
  dark: {
    background: '#050D10',
    backgroundDeep: '#081418',
    surface: '#0C1C20',
    surfaceRaised: '#122428',
    ink: '#EAF1F0',
    inkSoft: '#8FA8AD',
    line: '#1A3238',
    primary: '#5BC4CB',
    primarySoft: '#123438',
    onPrimary: '#050D10',
    gold: '#E0A94A',
    goldSoft: '#2E2414',
    onGold: '#050D10',
    moneyIn: '#5CC59A',
    moneyOut: '#EE8B78',
    ringGlow: 'rgba(91, 196, 203, 0.2)',
  },
} as const;

export type Theme = { [K in keyof typeof palette.light]: string };

export function useTheme(): Theme {
  const preference = useContext(ThemePreferenceContext);
  const system = useColorScheme();
  const { id: backdropId } = useBackdropTheme();
  const mode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const base = mode === 'dark' ? palette.dark : palette.light;
  const wash = BACKDROP_WASH[backdropId][mode === 'dark' ? 'dark' : 'light'];
  return { ...base, ...wash };
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, full: 999 } as const;

/**
 * Outfit when loaded via useFonts in the root layout.
 * Fallback names keep the UI readable before fonts finish loading.
 */
export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

/** System fallbacks only used while Outfit is still loading. */
export const fontsFallback = {
  regular: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' })!,
  medium: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'System' })!,
  semibold: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium', default: 'System' })!,
  bold: Platform.select({ ios: 'AvenirNext-Bold', android: 'sans-serif-black', default: 'System' })!,
} as const;
