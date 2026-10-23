import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { canUseLiquidGlass, glassFallbackFill, useReduceTransparency, useResolvedColorScheme } from '@/ui/glass';
import { fonts, useTheme } from '@/ui/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName, focusedName: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <TabGlyph name={focused ? focusedName : name} color={color} focused={focused} />;
  };

function TabGlyph({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 56,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? t.primarySoft : 'transparent',
      }}>
      <Ionicons name={name} size={21} color={typeof color === 'string' ? color : undefined} />
    </View>
  );
}

function TabBarBackground() {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const reduce = useReduceTransparency();
  const liquid = !reduce && canUseLiquidGlass();

  if (liquid) {
    return <GlassView glassEffectStyle="regular" colorScheme={scheme} style={StyleSheet.absoluteFill} />;
  }

  if (Platform.OS === 'ios' && !reduce) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: glassFallbackFill(scheme === 'dark'),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: scheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(28,36,48,0.08)',
          },
        ]}
      />
    );
  }

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surface }]} />;
}

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const appleGlass = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.inkSoft,
        tabBarHideOnKeyboard: true,
        tabBarBackground: appleGlass ? TabBarBackground : undefined,
        tabBarStyle: {
          backgroundColor: appleGlass ? 'transparent' : t.surface,
          borderTopColor: appleGlass ? 'transparent' : t.line,
          borderTopWidth: appleGlass ? 0 : 1,
          height: 64 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          elevation: 0,
          position: appleGlass ? 'absolute' : 'relative',
        },
        tabBarItemStyle: { height: 56, justifyContent: 'center' },
        tabBarIconStyle: { width: 56, height: 30 },
        tabBarLabelStyle: { fontSize: 11, marginTop: 4, fontFamily: fonts.semibold, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="transactions" options={{ title: 'Activity', tabBarIcon: icon('swap-vertical-outline', 'swap-vertical') }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets', tabBarIcon: icon('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('pie-chart-outline', 'pie-chart') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
