import { useState } from 'react';
import { View } from 'react-native';

import { useChartTheme } from '@/features/premium/ChartTheme';

import { AppText } from './kit';
import { useTheme } from './theme';

/**
 * Daily spend bars + cumulative line for one month.
 * Days after today are a lighter forecast at the pace so far.
 */
export function SpendChart({ daily, todayIndex }: { daily: number[]; todayIndex: number | null }) {
  const t = useTheme();
  const chart = useChartTheme();
  const [width, setWidth] = useState(0);
  const height = 168;
  const padX = 4;
  const padTop = 16;
  const padBottom = 22;
  const chartH = height - padTop - padBottom;

  const cumulative: number[] = [];
  let running = 0;
  for (const amount of daily) {
    running += amount;
    cumulative.push(running);
  }
  const elapsed = todayIndex == null ? daily.length : todayIndex + 1;
  const soFar = elapsed > 0 ? cumulative[Math.min(elapsed, cumulative.length) - 1] ?? 0 : 0;
  const rate = elapsed > 0 ? soFar / elapsed : 0;
  const series = cumulative.map((value, index) =>
    todayIndex == null || index <= todayIndex ? value : soFar + rate * (index - todayIndex),
  );

  const peakDaily = Math.max(1, ...daily);
  const peakCum = Math.max(1, ...series);
  const n = Math.max(1, daily.length);
  const gap = 2;
  const barSlot = width > 0 ? Math.max(2, (width - padX * 2) / n) : 0;
  const barW = Math.max(1.5, barSlot - gap);

  const xAt = (index: number) => {
    if (series.length <= 1) return padX + barSlot / 2;
    return padX + index * barSlot + barSlot / 2;
  };
  const yCum = (value: number) => padTop + (1 - value / peakCum) * chartH;

  const segments: { key: string; left: number; top: number; length: number; angle: number; projected: boolean }[] = [];
  if (width > 0 && series.length > 1) {
    for (let i = 1; i < series.length; i++) {
      const x1 = xAt(i - 1);
      const y1 = yCum(series[i - 1]);
      const x2 = xAt(i);
      const y2 = yCum(series[i]);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy);
      segments.push({
        key: String(i),
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - 1.25,
        length,
        angle: Math.atan2(dy, dx),
        projected: todayIndex != null && i > todayIndex,
      });
    }
  }

  const todayX = todayIndex != null && width > 0 ? xAt(todayIndex) : null;

  return (
    <View
      accessibilityLabel="Daily spending and running total for the month"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}>
      {/* Baseline */}
      <View
        style={{
          position: 'absolute',
          left: padX,
          right: padX,
          top: padTop + chartH,
          height: 1,
          backgroundColor: t.line,
        }}
      />

      {/* Daily bars — spend colour (chart theme); future days muted */}
      {width > 0 &&
        daily.map((amount, i) => {
          const future = todayIndex != null && i > todayIndex;
          const h = Math.max(amount > 0 ? 3 : 0, (amount / peakDaily) * chartH * 0.72);
          const isToday = todayIndex === i;
          return (
            <View
              key={`bar-${i}`}
              style={{
                position: 'absolute',
                left: padX + i * barSlot + (barSlot - barW) / 2,
                top: padTop + chartH - h,
                width: barW,
                height: h,
                borderRadius: 2,
                backgroundColor: isToday ? chart.line : future ? t.line : chart.line,
                opacity: future ? 0.35 : isToday ? 1 : 0.45,
              }}
            />
          );
        })}

      {todayX != null && (
        <View
          style={{
            position: 'absolute',
            left: todayX,
            top: padTop,
            height: chartH,
            width: 1,
            backgroundColor: t.inkSoft,
            opacity: 0.4,
          }}
        />
      )}

      {/* Cumulative line on top of bars */}
      {segments.map((seg) => (
        <View
          key={seg.key}
          style={{
            position: 'absolute',
            left: seg.left,
            top: seg.top,
            width: seg.length,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: seg.projected ? chart.forecast : chart.line,
            opacity: seg.projected ? 0.75 : 1,
            transform: [{ rotate: `${seg.angle}rad` }],
          }}
        />
      ))}

      {width > 0 && series.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: xAt(Math.min(todayIndex ?? series.length - 1, series.length - 1)) - 5,
            top: yCum(series[Math.min(todayIndex ?? series.length - 1, series.length - 1)]) - 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: chart.line,
            borderWidth: 2,
            borderColor: t.surface,
          }}
        />
      )}

      <View
        style={{
          position: 'absolute',
          left: padX,
          right: padX,
          bottom: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <AppText variant="caption" tone="soft">
          Day 1
        </AppText>
        <AppText variant="caption" tone="soft">
          Bars = daily · line = total
        </AppText>
        <AppText variant="caption" tone="soft">
          {daily.length}
        </AppText>
      </View>
    </View>
  );
}
