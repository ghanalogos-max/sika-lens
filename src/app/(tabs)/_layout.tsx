import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { NativeTabs } from 'expo-router/native-tabs';
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

/**
 * iOS: system NativeTabs — App Store–style frosted glass (≤18) / Liquid Glass (26+)
 * with content scrolling under the bar and minimize-on-scroll on iOS 26+.
 * Android: floating glass dock with a clear selected pill (Material has no Liquid Glass).
 */
export default function TabsLayout() {
  if (Platform.OS === 'ios') return <IosLiquidGlassTabs />;
  return <AndroidGlassTabs />;
}

function IosLiquidGlassTabs() {
  const t = useTheme();
  const soft = t.inkSoft;
  const selected = t.primary;

  return (
    <NativeTabs
      // iOS 26+: Liquid Glass shrinks while content scrolls (App Store motion).
      minimizeBehavior="onScrollDown"
      // iOS ≤18: system material blur so content shows through like App Store.
      // No-op on iOS 26+ where the system draws Liquid Glass from content behind.
      blurEffect="systemDefault"
      // Keep the frosted bar opaque at scroll edges (avoids a sudden clear bar).
      disableTransparentOnScrollEdge
      tintColor={selected}
      iconColor={{ default: soft, selected }}
      labelStyle={{
        default: { color: soft, fontSize: 10, fontWeight: '600' },
        selected: { color: selected, fontSize: 10, fontWeight: '600' },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home_filled' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'arrow.left.arrow.right', selected: 'arrow.left.arrow.right.circle.fill' }}
          md={{ default: 'swap_vert', selected: 'swap_vert' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="budgets">
        <NativeTabs.Trigger.Label>Budgets</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'wallet.pass', selected: 'wallet.pass.fill' }}
          md={{ default: 'account_balance_wallet', selected: 'account_balance_wallet' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights">
        <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
          md={{ default: 'pie_chart', selected: 'pie_chart_filled' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md={{ default: 'settings', selected: 'settings_filled' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const icon = (name: IconName, focusedName: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <TabGlyph name={focused ? focusedName : name} color={color} focused={focused} />;
  };

function TabGlyph({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const reduce = useReduceTransparency();
  const dark = scheme === 'dark';
  const liquid = !reduce && canUseLiquidGlass();
  const tint = typeof color === 'string' ? color : t.primary;

  if (focused && liquid) {
    return (
      <GlassView glassEffectStyle="clear" isInteractive colorScheme={scheme} style={styles.iconPill}>
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

function AndroidGlassTabs() {
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
