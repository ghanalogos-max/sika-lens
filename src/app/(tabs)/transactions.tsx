import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';

import { smsCutoffIso } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/PremiumProvider';
import { listCategories, recentTransactionsQuery } from '@/features/transactions/repository';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { AppText, Card, EmptyState, Screen } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

export default function Activity() {
  const t = useTheme();
  const { isPremium } = usePremium();
  const smsSince = useMemo(() => smsCutoffIso(isPremium), [isPremium]);
  const { data } = useLiveQuery(recentTransactionsQuery(500, smsSince), [smsSince]);
  const categoryNames = useMemo(() => new Map(listCategories().map((c) => [c.id, c.name])), []);

  return (
    <Screen scroll={false}>
      <AppText variant="title">Activity</AppText>
      <AppText tone="soft">
        {isPremium
          ? 'Tap to edit. Long press to delete. Paste every MoMo SMS so wallet balances stay true.'
          : 'Tap to edit. Long press to delete. Free plan hides MoMo imports older than 30 days. Paste every MoMo SMS so balances stay true.'}
      </AppText>
      {data.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          body="Add entries or paste every MoMo confirmation so your opening balance plus each move stays correct."
        />
      ) : (
        <Card style={{ flex: 1, paddingVertical: 4, gap: 0 }}>
          <FlatList
            data={data}
            keyExtractor={(tx) => String(tx.id)}
            renderItem={({ item, index }) => (
              <View style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: t.line }}>
                <TransactionRow tx={item} categoryName={item.categoryId ? categoryNames.get(item.categoryId) : undefined} />
              </View>
            )}
          />
        </Card>
      )}
    </Screen>
  );
}
