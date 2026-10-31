import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  canUseLiquidGlass,
  glassControlFill,
  glassFallbackFill,
  useReduceTransparency,
  useResolvedColorScheme,
} from '@/ui/glass';
import { fonts, useTheme } from '@/ui/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName, focusedName: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <TabGlyph name={focused ? focusedName : name} color={color} focused={focused} />;
  };

/** Glass pill behind each of the five tab icons when focused. */
function TabGlyph({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const reduce = useReduceTransparency();
  const dark = scheme === 'dark';
  const liquid = !reduce && canUseLiquidGlass();
  const tint = typeof color === 'string' ? color : t.primary;

  if (focused && liquid) {
    return (
      <GlassView
        glassEffectStyle="clear"
        isInteractive
        colorScheme={scheme}
        style={styles.iconPill}>
        <Ionicons name={name} size={22} color={tint} />
      </GlassView>
    );
  }

  const pillFill = focused
    ? reduce
      ? t.primarySoft
      : dark
        ? 'rgba(14, 106, 98, 0.38)'
        : 'rgba(14, 106, 98, 0.16)'
    : 'transparent';

  return (
    <View
      style={[
        styles.iconPill,
        focused && !reduce
          ? {
              backgroundColor: pillFill,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(14, 106, 98, 0.22)',
            }
          : { backgroundColor: pillFill },
      ]}>
      <Ionicons name={name} size={22} color={tint} />
    </View>
  );
}

function TabBarBackground() {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const reduce = useReduceTransparency();
  const liquid = !reduce && canUseLiquidGlass();
  const dark = scheme === 'dark';

  if (liquid) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={scheme}
        style={[StyleSheet.absoluteFill, styles.barShape]}
      />
    );
  }

  if (!reduce) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.barShape,
          {
            backgroundColor: Platform.OS === 'ios' ? glassFallbackFill(dark) : glassControlFill(dark),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,36,48,0.1)',
            shadowColor: '#1C2430',
            shadowOpacity: 0.14,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: Platform.OS === 'android' ? 8 : 0,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.barShape,
        {
          backgroundColor: t.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.line,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  barShape: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  iconPill: {
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.inkSoft,
        tabBarHideOnKeyboard: true,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: bottomGap,
          height: 62,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
        },
        tabBarItemStyle: { height: 50, justifyContent: 'center' },
        tabBarIconStyle: { width: 52, height: 32 },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
          fontFamily: fonts.semibold,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Activity', tabBarIcon: icon('swap-vertical-outline', 'swap-vertical') }}
      />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets', tabBarIcon: icon('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('pie-chart-outline', 'pie-chart') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
