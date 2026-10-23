import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { currentMonth, monthLabel, shiftMonth } from '@/lib/dates';

import { GlassSurface } from './GlassSurface';
import { AppText } from './kit';
import { space, useTheme } from './theme';

/** Steps through months. On the free plan, any month but the current one opens Premium. */
export function MonthPager({
  month,
  isPremium,
  onChange,
}: {
  month: string;
  isPremium: boolean;
  onChange: (month: string) => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const now = currentMonth();
  const atNow = month >= now;

  const go = (delta: number) => {
    const next = shiftMonth(month, delta);
    if (next > now) return;
    if (!isPremium && next !== now) {
      router.push('/premium');
      return;
    }
    onChange(next);
  };

  return (
    <GlassSurface
      interactive
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
        borderRadius: 999,
      }}>
      <Pressable
        onPress={() => go(-1)}
        hitSlop={10}
        accessibilityLabel="Previous month"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? t.primarySoft : 'transparent',
        })}>
        <Ionicons name="chevron-back" size={22} color={t.primary} />
      </Pressable>
      <View style={{ alignItems: 'center', paddingHorizontal: space.sm }}>
        <AppText variant="label">{monthLabel(month)}</AppText>
        {!isPremium && (
          <AppText variant="caption" tone="soft">
            Earlier months are Premium
          </AppText>
        )}
      </View>
      <Pressable
        onPress={() => go(1)}
        disabled={atNow}
        hitSlop={10}
        accessibilityLabel="Next month"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed && !atNow ? t.primarySoft : 'transparent',
          opacity: atNow ? 0.45 : 1,
        })}>
        <Ionicons name="chevron-forward" size={22} color={atNow ? t.inkSoft : t.primary} />
      </Pressable>
    </GlassSurface>
  );
}
