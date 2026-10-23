import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CHART_THEME_IDS,
  CHART_THEME_META,
  type ChartThemeId,
} from '@/features/premium/chartThemes';
import { useChartTheme } from '@/features/premium/ChartTheme';

import { GlassSurface } from './GlassSurface';
import { AppText } from './kit';
import { fonts, radius, space, useTheme } from './theme';

/**
 * Compact graph-colour control — swatch button opens a sheet (not an inline form field).
 */
export function ChartColourPicker({ isPremium }: { isPremium: boolean }) {
  const t = useTheme();
  const router = useRouter();
  const chart = useChartTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const meta = CHART_THEME_META[chart.id];

  const pick = (themeId: ChartThemeId) => {
    if (!isPremium && themeId !== 'lagoon') {
      setOpen(false);
      router.push('/premium');
      return;
    }
    chart.setTheme(themeId);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Graph colour ${meta.name}. Change colour.`}
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 6,
          paddingLeft: 6,
          paddingRight: 10,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: t.line,
          backgroundColor: pressed ? t.primarySoft : t.background,
          opacity: pressed ? 0.92 : 1,
        })}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: meta.swatch,
            borderWidth: 2,
            borderColor: t.surface,
          }}
        />
        <AppText variant="caption" style={{ fontFamily: fonts.semibold }}>
          {meta.name}
        </AppText>
        <Ionicons name="chevron-down" size={14} color={t.inkSoft} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(4, 14, 17, 0.45)' }} onPress={() => setOpen(false)} />
        <GlassSurface
          style={{
            maxHeight: '72%',
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            paddingTop: space.sm,
            paddingBottom: Math.max(insets.bottom, space.lg),
          }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: t.line, marginBottom: space.sm }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.md }}>
            <AppText variant="title" style={{ flex: 1, fontSize: 19 }}>
              Graph colour
            </AppText>
            <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={t.inkSoft} />
            </Pressable>
          </View>
          <AppText variant="caption" tone="soft" style={{ paddingHorizontal: space.lg, marginBottom: space.md }}>
            {isPremium ? 'Applies to the spend graph on Insights.' : 'Lagoon is free. Other colours need Premium.'}
          </AppText>
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.md }}>
            {CHART_THEME_IDS.map((themeId) => {
              const item = CHART_THEME_META[themeId];
              const locked = themeId !== 'lagoon' && !isPremium;
              const selected = chart.id === themeId;
              return (
                <Pressable
                  key={themeId}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name}${locked ? ', Premium' : ''}`}
                  onPress={() => pick(themeId)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingVertical: 14,
                    paddingHorizontal: space.md,
                    borderRadius: radius.md,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? t.primary : t.line,
                    backgroundColor: selected ? t.primarySoft : pressed ? t.background : 'transparent',
                    opacity: locked ? 0.78 : 1,
                  })}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: item.swatch,
                      borderWidth: selected ? 3 : 0,
                      borderColor: t.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {selected ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <AppText variant="label">{item.name}</AppText>
                    <AppText variant="caption" tone="soft">
                      {selected ? 'Selected' : locked ? 'Premium' : themeId === 'lagoon' ? 'Free' : 'Available'}
                    </AppText>
                  </View>
                  {locked ? <Ionicons name="lock-closed" size={16} color={t.inkSoft} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </GlassSurface>
      </Modal>
    </>
  );
}
