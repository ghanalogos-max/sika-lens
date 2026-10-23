import { GlassView } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  canUseLiquidGlass,
  glassFallbackFill,
  useReduceTransparency,
  useResolvedColorScheme,
} from './glass';
import { radius, useTheme } from './theme';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Prefer interactive liquid glass for controls (buttons, chips). */
  interactive?: boolean;
  /** Skip glass and use a solid surface (e.g. strongly tinted cards). */
  solid?: boolean;
};

/**
 * Apple glass surface: native Liquid Glass on supported iOS, translucent
 * frosted fallback on older iOS, solid theme surface elsewhere.
 */
export function GlassSurface({ children, style, interactive, solid }: Props) {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const reduce = useReduceTransparency();
  const liquid = !solid && !reduce && canUseLiquidGlass();
  const frostedIos = !solid && !reduce && !liquid && Platform.OS === 'ios';

  const shared: ViewStyle = {
    borderRadius: radius.lg,
  };

  if (liquid) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        colorScheme={scheme}
        style={[shared, style]}>
        {children}
      </GlassView>
    );
  }

  if (frostedIos) {
    return (
      <View
        style={[
          shared,
          {
            backgroundColor: glassFallbackFill(scheme === 'dark'),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(28,36,48,0.08)',
            shadowColor: '#1C2430',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
          },
          style,
        ]}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        shared,
        {
          backgroundColor: t.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.line,
          shadowColor: '#1C2430',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
