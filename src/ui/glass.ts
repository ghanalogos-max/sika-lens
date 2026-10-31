import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, useColorScheme } from 'react-native';

import { ThemePreferenceContext } from './ThemePreference';

/** True when native Liquid Glass can be rendered (iOS 26+ with API present). */
export function canUseLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

/** Soft translucent fill when Liquid Glass is unavailable — reads as frosted glass. */
export function glassFallbackFill(dark: boolean): string {
  return dark ? 'rgba(12, 28, 32, 0.72)' : 'rgba(255, 255, 255, 0.78)';
}

/** Stronger frosted fill for interactive controls (chips, quiet buttons). */
export function glassControlFill(dark: boolean): string {
  return dark ? 'rgba(18, 40, 44, 0.82)' : 'rgba(255, 255, 255, 0.88)';
}

export function useResolvedColorScheme(): 'light' | 'dark' {
  const preference = useContext(ThemePreferenceContext);
  const system = useColorScheme();
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

/** Prefer solid surfaces when the user asks the OS to reduce transparency. */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (alive) setReduce(!!v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
