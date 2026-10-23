import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { budgetRows } from '@/features/budgets/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import {
  feesInYear,
  monthSummary,
  spendByCategory,
  spendByDay,
  topRecipients,
  type CategorySpend,
  type MonthSummary,
  type RecipientSpend,
} from '@/features/insights/queries';
import { useChartTheme } from '@/features/premium/ChartTheme';
import { smsCutoffIso } from '@/features/premium/limits';
import { PremiumUpsell } from '@/features/premium/PremiumUpsell';
import { usePremium } from '@/features/premium/PremiumProvider';
import { currentMonth, daysInMonth, monthLabel, shiftMonth } from '@/lib/dates';
import { CategoryPie } from '@/ui/CategoryPie';
import { categoryColor } from '@/ui/categoryColors';
import { AppText, Bar, Card, CategoryGlyph, EmptyState, Screen } from '@/ui/kit';
import { MonthPager } from '@/ui/MonthPager';
import { SpendChart } from '@/ui/SpendChart';
import { space, useTheme } from '@/ui/theme';

export default function Insights() {
  const t = useTheme();
  const money = useFormatMoney();
  const { isPremium } = usePremium();
  const chart = useChartTheme();

  const trendLabel = (spent: number, previous: number, prevMonth: string): string => {
    const label = monthLabel(prevMonth);
    if (previous === 0) return spent === 0 ? `No spending in ${label} either` : `No spending in ${label}`;
    const delta = spent - previous;
    if (delta === 0) return `Same as ${label}`;
    return `${money.format(Math.abs(delta))} ${delta > 0 ? 'more than' : 'less than'} ${label}`;
  };
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<MonthSummary>({ spent: 0, sent: 0, expenses: 0, received: 0, fees: 0 });
  const [daily, setDaily] = useState<number[]>([]);
  const [budgetCap, setBudgetCap] = useState(0);
  const [categories, setCategories] = useState<CategorySpend[]>([]);
  const [previous, setPrevious] = useState<Map<number | null, number>>(new Map());
  const [recipients, setRecipients] = useState<RecipientSpend[]>([]);
  const [yearFees, setYearFees] = useState(0);
  const smsSince = useMemo(() => smsCutoffIso(isPremium), [isPremium]);
  const prevMonth = shiftMonth(month, -1);

  useEffect(() => {
    if (!isPremium && month !== currentMonth()) setMonth(currentMonth());
  }, [isPremium, month]);

  useFocusEffect(
    useCallback(() => {
      setSummary(monthSummary(month, smsSince));
      setDaily(spendByDay(month, smsSince));
      setBudgetCap(budgetRows(month, smsSince).reduce((sum, row) => sum + (row.limit ?? 0), 0));
      const rows = spendByCategory(month, smsSince);
      setCategories(rows);
      setPrevious(new Map(spendByCategory(prevMonth, smsSince).map((c) => [c.categoryId, c.spent])));
      setRecipients(topRecipients(month, 5, smsSince));
      setYearFees(feesInYear(Number(month.slice(0, 4)), smsSince));
    }, [month, prevMonth, smsSince]),
  );

  const max = Math.max(1, ...categories.map((c) => c.spent));
  const days = daily.length || daysInMonth(month);
  const isThisMonth = month === currentMonth();
  const today = isThisMonth ? new Date().getUTCDate() : days;
  const todayIndex = isThisMonth ? Math.min(today, days) - 1 : null;
  const daysLeft = Math.max(1, days - today);
  const room = budgetCap - summary.spent;
  const perDay = Math.floor(room / daysLeft);
  const monthRatio = today / days;
  const pieSlices = categories.slice(0, 8).map((c) => ({
    name: c.name,
    value: c.spent,
    color: categoryColor(c.name),
  }));

  return (
    <Screen>
      <AppText variant="display" style={{ fontSize: 32 }}>
        Insights
      </AppText>
      <MonthPager month={month} isPremium={isPremium} onChange={setMonth} />

      <Card>
        <AppText variant="caption" tone="soft">
          Spent in {monthLabel(month)}
        </AppText>
        <AppText variant="display" style={{ fontSize: 32 }}>
          {money.format(summary.spent)}
          {budgetCap > 0 && (
            <AppText variant="title" tone="soft">
              {' '}
              of {money.format(budgetCap)}
            </AppText>
          )}
        </AppText>
        <SpendChart daily={daily.length ? daily : Array.from({ length: days }, () => 0)} todayIndex={todayIndex} />
        <View style={{ marginTop: space.md, gap: 6 }}>
          <AppText variant="caption" tone="soft">
            Month progress
          </AppText>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: t.line, overflow: 'hidden' }}>
            <View style={{ width: `${monthRatio * 100}%`, height: '100%', backgroundColor: chart.line }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" tone="soft">
              Day 1
            </AppText>
            <AppText variant="caption">{isThisMonth ? 'Today' : 'End'}</AppText>
            <AppText variant="caption" tone="soft">
              Day {days}
            </AppText>
          </View>
        </View>
      </Card>

      <Card solid style={{ backgroundColor: room < 0 ? t.surface : t.primarySoft, borderColor: 'transparent' }}>
        <AppText tone={room < 0 ? 'out' : 'ink'}>
          {budgetCap <= 0
            ? 'Set category limits on Budgets to see how much you can still spend each day.'
            : room < 0
              ? `You are ${money.format(-room)} over the limits you set.`
              : `Keep going. You can spend ${money.format(perDay)} each day for the rest of the month.`}
        </AppText>
      </Card>

      <Card>
        <AppText variant="label">Spend by category</AppText>
        <AppText variant="caption" tone="soft" style={{ marginBottom: space.md }}>
          Pie chart of this month’s spend
        </AppText>
        <CategoryPie
          slices={pieSlices}
          centerLabel="Spent"
          centerValue={money.format(summary.spent)}
        />
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          title="No spending yet this month"
          body="Log a few transactions and this page shows which categories and people take the most."
        />
      ) : (
        <>
          <Card>
            <AppText variant="label">Category detail</AppText>
            {categories.map((c) => {
              const color = categoryColor(c.name);
              return (
                <View key={c.categoryId ?? 'none'} style={{ gap: 4, paddingVertical: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                      <CategoryGlyph name={c.name} size={16} />
                      <AppText style={{ flex: 1 }}>{c.name}</AppText>
                    </View>
                    <AppText variant="label">{money.format(c.spent)}</AppText>
                  </View>
                  {isPremium && (
                    <AppText variant="caption" tone="soft">
                      {trendLabel(c.spent, previous.get(c.categoryId) ?? 0, prevMonth)}
                    </AppText>
                  )}
                  <Bar ratio={c.spent / max} color={color} />
                </View>
              );
            })}
          </Card>

          {recipients.length > 0 && (
            <Card>
              <AppText variant="label">Biggest recipients</AppText>
              {recipients.map((r) => (
                <View
                  key={r.counterparty}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ flex: 1 }}>{r.counterparty}</AppText>
                    <AppText variant="caption" tone="soft">
                      {r.count} {r.count === 1 ? 'payment' : 'payments'}
                    </AppText>
                  </View>
                  <AppText variant="label">{money.format(r.spent)}</AppText>
                </View>
              ))}
            </Card>
          )}
        </>
      )}

      <Card>
        <AppText variant="label">Network fees</AppText>
        <AppText variant="title">{money.format(summary.fees)}</AppText>
        <AppText tone="soft">What the networks charged you this month, on top of what you sent.</AppText>
      </Card>

      {isPremium ? (
        <Card>
          <AppText variant="label">Fees in {month.slice(0, 4)}</AppText>
          <AppText variant="title">{money.format(yearFees)}</AppText>
          <AppText tone="soft">Every network fee from January through December.</AppText>
        </Card>
      ) : (
        <PremiumUpsell
          title="Trends and fee totals"
          body="Premium compares each category with last month and totals network fees for the year."
        />
      )}
    </Screen>
  );
}
