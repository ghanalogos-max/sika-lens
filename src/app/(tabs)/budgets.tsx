import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { pesewasToInput, tryToPesewas } from '@/core/money/money';
import { budgetRows, setBudget, type BudgetRow } from '@/features/budgets/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { smsCutoffIso } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/PremiumProvider';
import { addCategory } from '@/features/transactions/repository';
import { currentMonth, daysInMonth, monthLabel } from '@/lib/dates';
import { AppText, Bar, Button, Card, CategoryGlyph, Field, Screen } from '@/ui/kit';
import { MonthPager } from '@/ui/MonthPager';
import { space, useTheme } from '@/ui/theme';

function BudgetItem({ row, onSave }: { row: BudgetRow; onSave: (categoryId: number, limit: number | null) => void }) {
  const money = useFormatMoney();
  const [text, setText] = useState(row.limit ? pesewasToInput(row.limit) : '');
  const over = row.limit !== null && row.spent > row.limit;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
          <CategoryGlyph name={row.name} />
          <AppText variant="label" style={{ flex: 1 }}>
            {row.name}
          </AppText>
        </View>
        <AppText variant="label" tone={over ? 'out' : 'ink'}>
          {money.format(row.spent)}
          {row.limit !== null ? ` of ${money.format(row.limit)}` : ''}
        </AppText>
      </View>
      {row.limit !== null && <Bar ratio={row.spent / row.limit} over={over} />}
      <Field
        label={`Monthly limit (${money.symbol})`}
        value={text}
        onChangeText={setText}
        keyboardType="decimal-pad"
        placeholder="No limit"
        onEndEditing={() => onSave(row.categoryId, text.trim() ? tryToPesewas(text) : null)}
      />
    </Card>
  );
}

export default function Budgets() {
  const t = useTheme();
  const money = useFormatMoney();
  const { isPremium } = usePremium();
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const smsSince = useMemo(() => smsCutoffIso(isPremium), [isPremium]);
  const load = useCallback(() => setRows(budgetRows(month, smsSince)), [month, smsSince]);
  useFocusEffect(load);

  useEffect(() => {
    if (!isPremium && month !== currentMonth()) setMonth(currentMonth());
  }, [isPremium, month]);

  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState<string | null>(null);

  const cap = rows.reduce((sum, row) => sum + (row.limit ?? 0), 0);
  const spent = rows.reduce((sum, row) => sum + row.spent, 0);
  const days = daysInMonth(month);
  const today = month === currentMonth() ? new Date().getUTCDate() : days;

  const saveCategory = () => {
    const name = newName.trim();
    if (!name) {
      setNewError('Type a name for the category.');
      return;
    }
    try {
      addCategory(name);
      setNewName('');
      setNewError(null);
      load();
    } catch {
      setNewError('Could not save that category.');
    }
  };

  return (
    <Screen>
      <AppText variant="display" style={{ fontSize: 32 }}>
        Budgets
      </AppText>
      <MonthPager month={month} isPremium={isPremium} onChange={setMonth} />
      {cap > 0 && (
        <Card>
          <AppText variant="caption" tone="soft">
            {monthLabel(month)}
          </AppText>
          <AppText variant="display" style={{ fontSize: 30 }} tone={spent > cap ? 'out' : 'ink'}>
            {money.format(spent)}
            <AppText variant="title" tone="soft">
              {' '}
              of {money.format(cap)}
            </AppText>
          </AppText>
          <Bar ratio={cap === 0 ? 0 : spent / cap} over={spent > cap} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" tone="soft">
              Day {today} of {days}
            </AppText>
            <AppText variant="caption" tone="soft">
              {Math.round((today / days) * 100)}% through the month
            </AppText>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.line, overflow: 'hidden', marginTop: 4 }}>
            <View style={{ width: `${(today / days) * 100}%`, height: '100%', backgroundColor: t.moneyIn }} />
          </View>
        </Card>
      )}
      {rows.map((row) => (
        <BudgetItem
          key={row.categoryId}
          row={row}
          onSave={(categoryId, limit) => {
            setBudget(categoryId, month, limit);
            load();
          }}
        />
      ))}

      <Card style={{ gap: space.sm }}>
        <AppText variant="label">Add a category</AppText>
        <AppText variant="caption" tone="soft">
          New categories show up here and when you log expenses.
        </AppText>
        <Field
          label="Name"
          value={newName}
          onChangeText={(v) => {
            setNewName(v);
            setNewError(null);
          }}
          placeholder="e.g. Church offering"
          autoCapitalize="words"
          onSubmitEditing={saveCategory}
        />
        {newError && <AppText tone="out">{newError}</AppText>}
        <Button title="Save category" onPress={saveCategory} disabled={!newName.trim()} />
      </Card>
    </Screen>
  );
}
