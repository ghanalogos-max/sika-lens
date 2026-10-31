import { GlassView } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  canUseLiquidGlass,
  glassControlFill,
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
 * frosted fallback on older iOS / Android, solid when Reduce Transparency is on.
 */
export function GlassSurface({ children, style, interactive, solid }: Props) {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const reduce = useReduceTransparency();
  const dark = scheme === 'dark';
  const liquid = !solid && !reduce && canUseLiquidGlass();
  const frosted = !solid && !reduce && !liquid;

  const shared: ViewStyle = {
    borderRadius: radius.lg,
  };

  if (liquid) {
    return (
      <GlassView
        glassEffectStyle={interactive ? 'clear' : 'regular'}
        isInteractive={interactive}
        colorScheme={scheme}
        style={[shared, style]}>
        {children}
      </GlassView>
    );
  }

  if (frosted) {
    const fill = interactive ? glassControlFill(dark) : glassFallbackFill(dark);
    return (
      <View
        style={[
          shared,
          {
            backgroundColor: fill,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,36,48,0.1)',
            shadowColor: '#1C2430',
            shadowOpacity: interactive ? 0.06 : 0.1,
            shadowRadius: interactive ? 10 : 18,
            shadowOffset: { width: 0, height: interactive ? 3 : 8 },
            elevation: Platform.OS === 'android' ? (interactive ? 2 : 3) : 0,
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
