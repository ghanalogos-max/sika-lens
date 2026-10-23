import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChartTheme } from '@/features/premium/ChartTheme';

import { categoryColor, categorySoft } from './categoryColors';
import { categoryIcon, type IonName } from './categoryIcons';
import { useResolvedColorScheme } from './glass';
import { GlassSurface } from './GlassSurface';
import { fonts, radius, space, useTheme } from './theme';

export function Screen({
  children,
  scroll = true,
  padded = true,
  decor,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Fixed chrome above the scroll view (e.g. home money bubble). */
  decor?: ReactNode;
}) {
  const t = useTheme();
  // Extra bottom room so content clears the tab bar (absolute glass bar on iOS).
  const pad = padded
    ? { padding: space.lg, gap: space.lg, paddingBottom: space.xxl + (Platform.OS === 'ios' ? 56 : 24) }
    : { gap: space.lg, paddingBottom: 8 };
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <LagoonBackdrop />
      {decor ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, zIndex: 0 }}>
          {decor}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: 'transparent', zIndex: 1 }}
          contentContainerStyle={pad}>
          <Animated.View entering={FadeInDown.duration(420).springify().damping(18)} style={{ gap: space.lg }}>
            {children}
          </Animated.View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, zIndex: 1, backgroundColor: 'transparent' }, pad]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type Variant = 'display' | 'title' | 'body' | 'label' | 'caption';
type Tone = 'ink' | 'soft' | 'in' | 'out' | 'primary' | 'gold' | 'onPrimary';

const VARIANTS: Record<
  Variant,
  { fontSize: number; lineHeight: number; fontFamily: string; fontWeight?: '400' | '500' | '600' | '700'; letterSpacing?: number }
> = {
  display: { fontSize: 36, lineHeight: 42, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontFamily: fonts.semibold, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium, fontWeight: '500' },
};

export function AppText({
  variant = 'body',
  tone = 'ink',
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const t = useTheme();
  const color = {
    ink: t.ink,
    soft: t.inkSoft,
    in: t.moneyIn,
    out: t.moneyOut,
    primary: t.primary,
    gold: t.gold,
    onPrimary: t.onPrimary,
  }[tone];
  return <Text {...rest} style={[VARIANTS[variant], { color }, style]} />;
}

export function Card({
  children,
  style,
  solid,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Force opaque surface (tinted callouts, gold upsells). */
  solid?: boolean;
}) {
  return (
    <GlassSurface solid={solid} style={[{ padding: space.lg, gap: space.sm }, style]}>
      {children}
    </GlassSurface>
  );
}

/** Soft layered wash — atmosphere without diagonal slope accents. */
export function LagoonBackdrop() {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const dark = scheme === 'dark';
  // Light: faint accent blobs so the canvas stays bank-light. Dark: stronger glow.
  const o = dark
    ? { top: 0.55, gold: 0.4, bottom: 0.32, mid: 0.2 }
    : { top: 0.22, gold: 0.16, bottom: 0.14, mid: 0.1 };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.background }]}>
      <View
        style={{
          position: 'absolute',
          top: -100,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: t.primarySoft,
          opacity: o.top,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 180,
          left: -90,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: t.goldSoft,
          opacity: o.gold,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: t.primarySoft,
          opacity: o.bottom,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 120,
          left: '35%',
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: t.goldSoft,
          opacity: o.mid,
        }}
      />
    </View>
  );
}

/** Flat home summary panel — glass on Apple, solid elsewhere. */
export function HeroWash({ children }: { children: ReactNode }) {
  return (
    <GlassSurface style={{ paddingVertical: space.xl, paddingHorizontal: space.lg }}>
      {children}
    </GlassSurface>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'quiet' | 'gold';
  disabled?: boolean;
}) {
  const t = useTheme();
  const bg =
    variant === 'primary' ? t.primary : variant === 'gold' ? t.gold : t.primarySoft;
  const fg = variant === 'quiet' ? t.primary : variant === 'gold' ? t.onGold : t.onPrimary;
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      style={{ opacity: disabled ? 0.5 : 1 }}>
      <Animated.View
        style={[
          {
            backgroundColor: bg,
            borderRadius: radius.md,
            paddingVertical: 15,
            alignItems: 'center',
            shadowColor: variant === 'quiet' ? 'transparent' : bg,
            shadowOpacity: variant === 'quiet' ? 0 : 0.28,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: variant === 'quiet' ? 0 : 3,
          },
          anim,
        ]}>
        <Text
          style={{
            color: fg,
            fontSize: 16,
            fontFamily: fonts.semibold,
            fontWeight: '600',
            letterSpacing: 0.2,
          }}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Square shortcut tile for the Home screen; use three in a row. */
export function QuickAction({
  icon,
  label,
  onPress,
  tone = 'quiet',
}: {
  icon: IonName;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'gold' | 'quiet';
}) {
  const t = useTheme();
  const bubble = tone === 'primary' ? t.primary : tone === 'gold' ? t.gold : t.primarySoft;
  const glyph = tone === 'quiet' ? t.primary : tone === 'gold' ? t.onGold : t.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: 10,
        paddingVertical: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: pressed ? t.primary : t.line,
        backgroundColor: pressed ? t.primarySoft : t.surface,
        shadowColor: '#1C2430',
        shadowOpacity: pressed ? 0.02 : 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: bubble,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: bubble,
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        }}>
        <Ionicons name={icon} size={22} color={glyph} />
      </View>
      <Text style={{ color: t.ink, fontSize: 13, fontFamily: fonts.semibold, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IonName;
}) {
  const t = useTheme();
  const color = selected ? t.primary : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? t.primary : t.line,
        backgroundColor: selected ? t.primarySoft : pressed ? t.surfaceRaised : t.surface,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      {icon ? <Ionicons name={icon} size={16} color={color} /> : null}
      <Text
        style={{
          color,
          fontSize: 14,
          fontFamily: selected ? fonts.semibold : fonts.regular,
          fontWeight: selected ? '600' : '400',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Round category icon — soft fill matches pie/bar colour for that name. */
export function CategoryGlyph({ name, size = 18 }: { name: string; size?: number }) {
  const dark = useResolvedColorScheme() === 'dark';
  const box = size + 22;
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: box / 2,
        backgroundColor: categorySoft(name, dark),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={categoryIcon(name)} size={size} color={categoryColor(name)} />
    </View>
  );
}

/** Form field with focus ring, soft fill, optional leading icon and hint. */
export function Field({
  label,
  hint,
  icon,
  style,
  onFocus,
  onBlur,
  ...input
}: TextInputProps & { label: string; hint?: string; icon?: IonName }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="label">{label}</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 52,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? t.primary : t.line,
          backgroundColor: focused ? t.surfaceRaised : t.surface,
          shadowColor: t.primary,
          shadowOpacity: focused ? 0.14 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        }}>
        {icon ? <Ionicons name={icon} size={18} color={focused ? t.primary : t.inkSoft} /> : null}
        <TextInput
          placeholderTextColor={t.inkSoft}
          {...input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              paddingVertical: Platform.OS === 'ios' ? 14 : 12,
              fontSize: 16,
              fontFamily: fonts.regular,
              color: t.ink,
            },
            style,
          ]}
        />
      </View>
      {hint ? (
        <AppText variant="caption" tone="soft">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Horizontal progress bar. `ratio` can exceed 1 (over budget). */
export function Bar({ ratio, over, color }: { ratio: number; over?: boolean; color?: string }) {
  const t = useTheme();
  const chart = useChartTheme();
  const fill = over ? t.moneyOut : color ?? chart.line;
  const clamped = Math.max(0, Math.min(1, ratio));
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(clamped * 100, { duration: 520 });
  }, [clamped, width]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: t.line, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: 5,
            backgroundColor: fill,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon = 'wallet-outline',
}: {
  title: string;
  body: string;
  icon?: IonName;
}) {
  const t = useTheme();
  return (
    <Card>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: t.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.xs,
          borderWidth: 1,
          borderColor: t.line,
        }}>
        <Ionicons name={icon} size={26} color={t.primary} />
      </View>
      <AppText variant="title">{title}</AppText>
      <AppText tone="soft">{body}</AppText>
    </Card>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <AppText variant="title" style={{ flexShrink: 1 }}>
        {title}
      </AppText>
      {action}
    </View>
  );
}
