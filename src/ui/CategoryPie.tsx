import { View } from 'react-native';

import { categoryColor } from './categoryColors';
import { AppText } from './kit';
import { space, useTheme } from './theme';

export type PieSlice = { name: string; value: number; color?: string };

const SEGMENTS = 120; // 3° each — continuous ring without package deps

/**
 * Category share as a donut (arc segments + hole). Legend matches category bars.
 */
export function CategoryPie({
  slices,
  size = 200,
  centerLabel,
  centerValue,
}: {
  slices: PieSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const t = useTheme();
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const coloured = slices
    .filter((s) => s.value > 0)
    .map((s) => ({ ...s, color: s.color ?? categoryColor(s.name) }));

  if (total <= 0 || coloured.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: space.xl, gap: space.sm }}>
        <View
          style={{
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            borderWidth: 18,
            borderColor: t.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <AppText variant="caption" tone="soft" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
            No split yet
          </AppText>
        </View>
      </View>
    );
  }

  const segColors: string[] = [];
  let cursor = 0;
  for (const s of coloured) {
    const count = Math.max(1, Math.round((s.value / total) * SEGMENTS));
    for (let i = 0; i < count && cursor < SEGMENTS; i++, cursor++) segColors.push(s.color);
  }
  while (segColors.length < SEGMENTS) segColors.push(coloured[coloured.length - 1]!.color);
  if (segColors.length > SEGMENTS) segColors.length = SEGMENTS;

  const hole = size * 0.58;
  const ring = (size - hole) / 2;
  // Slight overlap so neighbouring arcs leave no hairline gaps.
  const segW = Math.max(4, (Math.PI * size) / SEGMENTS + 1.2);

  return (
    <View style={{ alignItems: 'center', gap: space.lg }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {segColors.map((color, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: size,
              height: size,
              alignItems: 'center',
              transform: [{ rotate: `${(i / SEGMENTS) * 360 - 90}deg` }],
            }}>
            <View
              style={{
                width: segW,
                height: ring,
                borderTopLeftRadius: segW / 2,
                borderTopRightRadius: segW / 2,
                backgroundColor: color,
              }}
            />
          </View>
        ))}
        <View
          pointerEvents="none"
          style={{
            width: hole,
            height: hole,
            borderRadius: hole / 2,
            backgroundColor: t.background,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: t.line,
          }}>
          {centerValue ? (
            <>
              <AppText variant="caption" tone="soft" style={{ textAlign: 'center' }}>
                {centerLabel ?? 'Total'}
              </AppText>
              <AppText variant="label" style={{ textAlign: 'center', fontSize: 14 }} numberOfLines={2}>
                {centerValue}
              </AppText>
            </>
          ) : null}
        </View>
      </View>

      <View style={{ alignSelf: 'stretch', gap: 10 }}>
        {coloured.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: s.color }} />
              <AppText style={{ flex: 1 }} numberOfLines={1}>
                {s.name}
              </AppText>
              <AppText variant="label" style={{ minWidth: 40, textAlign: 'right' }}>
                {pct}%
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}
