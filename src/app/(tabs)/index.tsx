import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { listAccounts, totalBalances } from '@/features/accounts/repository';
import { budgetRows } from '@/features/budgets/repository';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { monthSummary, type MonthSummary } from '@/features/insights/queries';
import { smsCutoffIso } from '@/features/premium/limits';
import { usePremium } from '@/features/premium/PremiumProvider';
import { loadBalancesVisible, loadProfileName, saveBalancesVisible } from '@/features/profile/storage';
import { listCategories, recentTransactionsQuery } from '@/features/transactions/repository';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { currentMonth, dayGreeting, monthLabel } from '@/lib/dates';
import { useLock } from '@/features/security/LockProvider';
import { BrandMark } from '@/ui/BrandMark';
import { CediBubble } from '@/ui/CediBubble';
import type { IonName } from '@/ui/categoryIcons';
import { AppText, Button, Card, EmptyState, HeroWash, Screen, SectionHeader } from '@/ui/kit';
import { fonts, radius, space, useTheme } from '@/ui/theme';

function Money({
  value,
  visible,
  tone,
  variant = 'label',
  signed,
  align = 'right',
}: {
  value: number;
  visible: boolean;
  tone?: 'ink' | 'soft' | 'in' | 'out' | 'primary' | 'gold';
  variant?: 'display' | 'title' | 'label' | 'caption';
  signed?: '+' | '−' | null;
  align?: 'left' | 'right';
}) {
  const money = useFormatMoney();
  const text = visible
    ? `${signed ?? ''}${money.format(value)}`
    : money.mask({ signed: signed ?? null });
  return (
    <AppText
      variant={variant}
      tone={tone}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      style={{
        flexShrink: 1,
        textAlign: align,
        ...(variant === 'display' ? { fontSize: 36, lineHeight: 44, textAlign: 'left' as const } : null),
      }}>
      {text}
    </AppText>
  );
}

function MonthStat({
  label,
  value,
  tone,
  signed,
  visible,
}: {
  label: string;
  value: number;
  tone: 'in' | 'out' | 'ink';
  signed: '+' | '−';
  visible: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.md,
        minHeight: 28,
      }}>
      <AppText variant="caption" tone="soft" style={{ flexShrink: 0 }}>
        {label}
      </AppText>
      <Money value={value} visible={visible} tone={tone} signed={signed} variant="label" />
    </View>
  );
}

function ServiceTile({
  icon,
  label,
  onPress,
}: {
  icon: IonName;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: '33.33%',
        alignItems: 'center',
        gap: 8,
        paddingVertical: space.sm,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}>
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: t.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: t.primary,
          shadowOpacity: 0.28,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}>
        <Ionicons name={icon} size={24} color={t.onPrimary} />
      </View>
      <AppText variant="caption" style={{ textAlign: 'center', fontFamily: fonts.semibold }} numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

function WideCta({
  icon,
  label,
  onPress,
  tone = 'primary',
}: {
  icon: IonName;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'gold';
}) {
  const t = useTheme();
  const bg = tone === 'gold' ? t.gold : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: radius.md,
        backgroundColor: bg,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: bg,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      })}>
      <Ionicons name={icon} size={18} color={tone === 'gold' ? t.onGold : t.onPrimary} />
      <AppText
        style={{
          color: tone === 'gold' ? t.onGold : t.onPrimary,
          fontFamily: fonts.semibold,
          fontSize: 14,
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  const { pinSet, lock } = useLock();
  const month = currentMonth();
  const smsSince = useMemo(() => smsCutoffIso(isPremium), [isPremium]);
  const [summary, setSummary] = useState<MonthSummary>({ spent: 0, sent: 0, expenses: 0, received: 0, fees: 0 });
  const [overCount, setOverCount] = useState(0);
  const [wallets, setWallets] = useState(listAccounts());
  const [walletTotal, setWalletTotal] = useState(0);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [balancesVisible, setBalancesVisible] = useState(true);
  const { data: recent } = useLiveQuery(recentTransactionsQuery(5, smsSince), [smsSince]);
  const categoryNames = useMemo(() => new Map(listCategories().map((c) => [c.id, c.name])), []);

  useFocusEffect(
    useCallback(() => {
      setSummary(monthSummary(month, smsSince));
      setOverCount(budgetRows(month, smsSince).filter((b) => b.limit !== null && b.spent > b.limit).length);
      setWallets(listAccounts());
      setWalletTotal(totalBalances());
      void loadProfileName().then(setProfileName);
      void loadBalancesVisible().then(setBalancesVisible);
    }, [month, recent, smsSince]),
  );

  const toggleBalances = () => {
    const next = !balancesVisible;
    setBalancesVisible(next);
    void saveBalancesVisible(next);
  };

  const greeting = profileName ? `${dayGreeting()}, ${profileName}` : dayGreeting();
  const netMonth = summary.received - summary.expenses;
  const initial = (profileName?.trim().charAt(0) || 'S').toUpperCase();

  return (
    <Screen>
      <View style={{ position: 'relative', minHeight: 56, justifyContent: 'visible' }}>
        <CediBubble
          size={200}
          style={{ position: 'absolute', top: -36, right: -20, zIndex: 0 }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.md,
            zIndex: 1,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: t.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AppText style={{ color: t.onPrimary, fontFamily: fonts.bold, fontSize: 18 }}>{initial}</AppText>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="caption" tone="soft">
                {monthLabel(month)} · SikaLens
              </AppText>
              <AppText variant="title" style={{ fontSize: 20 }} numberOfLines={1}>
                {greeting}
              </AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            {pinSet ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log out"
                onPress={lock}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: t.surface,
                  borderWidth: 1,
                  borderColor: t.line,
                  opacity: pressed ? 0.85 : 1,
                })}>
                <Ionicons name="log-out-outline" size={20} color={t.primary} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.line,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Ionicons name="settings-outline" size={20} color={t.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      <HeroWash>
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="caption" tone="soft">
                Total balance
              </AppText>
              <Money value={walletTotal} visible={balancesVisible} variant="display" />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={balancesVisible ? 'Hide balances' : 'Show balances'}
              onPress={toggleBalances}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.line,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}>
              <Ionicons name={balancesVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color={t.primary} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/accounts')}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radius.full,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.line,
              opacity: pressed ? 0.85 : 1,
            })}>
            <AppText variant="label" tone="primary">
              My wallets
            </AppText>
          </Pressable>

          <View style={{ gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: t.line }}>
            <MonthStat label="Received" value={summary.received} visible={balancesVisible} tone="in" signed="+" />
            <MonthStat label="Expenses" value={summary.expenses} visible={balancesVisible} tone="out" signed="−" />
            <MonthStat
              label="Net"
              value={Math.abs(netMonth)}
              visible={balancesVisible}
              tone={netMonth >= 0 ? 'in' : 'out'}
              signed={netMonth >= 0 ? '+' : '−'}
            />
          </View>

          {overCount > 0 && (
            <AppText variant="caption" tone="out">
              Over budget in {overCount} {overCount === 1 ? 'category' : 'categories'}
            </AppText>
          )}
        </View>
      </HeroWash>

      <Card style={{ paddingVertical: space.md }}>
        <AppText variant="label" style={{ marginBottom: space.xs, paddingHorizontal: space.xs }}>
          Quick services
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <ServiceTile
            icon="remove-circle-outline"
            label="Expense"
            onPress={() => router.push({ pathname: '/add-transaction', params: { kind: 'expense' } })}
          />
          <ServiceTile icon="add-circle-outline" label="Add money" onPress={() => router.push('/add-transaction')} />
          <ServiceTile icon="briefcase-outline" label="Salary" onPress={() => router.push('/add-salary')} />
          <ServiceTile icon="chatbubble-ellipses-outline" label="Read SMS" onPress={() => router.push('/import-sms')} />
          <ServiceTile icon="wallet-outline" label="Budgets" onPress={() => router.push('/budgets')} />
          <ServiceTile icon="pie-chart-outline" label="Insights" onPress={() => router.push('/insights')} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <WideCta icon="qr-code-outline" label="Log transfer" onPress={() => router.push('/add-transaction')} />
        <WideCta icon="sparkles-outline" label="Live rates" tone="gold" onPress={() => router.push('/convert')} />
      </View>

      <SectionHeader
        title="Balances"
        action={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Pressable onPress={toggleBalances} hitSlop={8}>
              <AppText variant="label" tone="primary">
                {balancesVisible ? 'Hide' : 'Show'}
              </AppText>
            </Pressable>
            <Pressable onPress={() => router.push('/accounts')} hitSlop={8}>
              <AppText variant="label" tone="primary">
                Manage
              </AppText>
            </Pressable>
          </View>
        }
      />

      {wallets.length === 0 ? (
        <Card>
          <AppText variant="label">Add your MoMo & banks</AppText>
          <AppText tone="soft">Track MTN, Telecel, AirtelTigo and Ghana bank balances in one place.</AppText>
          <Button title="Add a wallet" onPress={() => router.push('/accounts')} />
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {(['momo', 'bank', 'cash', 'other'] as const)
            .filter((kind) => wallets.some((a) => a.kind === kind))
            .map((kind) => {
              const rows = wallets.filter((a) => a.kind === kind);
              const title = kind === 'momo' ? 'MoMo' : kind === 'bank' ? 'Bank' : kind === 'cash' ? 'Cash' : 'Other';
              const groupTotal = rows.reduce((sum, a) => sum + a.balance, 0);
              return (
                <Card key={kind} style={{ gap: 0, paddingVertical: space.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: space.md,
                      paddingHorizontal: space.sm,
                      paddingVertical: 6,
                    }}>
                    <AppText variant="label" style={{ flex: 1 }}>
                      {title}
                    </AppText>
                    <Money value={groupTotal} visible={balancesVisible} />
                  </View>
                  {rows.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => router.push('/accounts')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: space.md,
                        paddingVertical: 12,
                        paddingHorizontal: space.sm,
                      }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.full,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: t.primarySoft,
                          overflow: 'hidden',
                        }}>
                        <BrandMark brandId={a.brandId} size="sm" />
                      </View>
                      <AppText style={{ flex: 1 }}>{a.name}</AppText>
                      <Money value={a.balance} visible={balancesVisible} />
                    </Pressable>
                  ))}
                </Card>
              );
            })}
        </View>
      )}

      {recent.length === 0 ? (
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Nothing logged yet"
          body="Copy a MoMo confirmation SMS and tap Read SMS to log your first transaction."
        />
      ) : (
        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Latest"
            action={
              <Pressable onPress={() => router.push('/transactions')} hitSlop={8}>
                <AppText variant="label" tone="primary">
                  See all
                </AppText>
              </Pressable>
            }
          />
          <Card style={{ paddingVertical: space.sm, gap: 0 }}>
            {recent.map((tx, i) => (
              <View key={tx.id} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.line }}>
                <TransactionRow
                  tx={tx}
                  categoryName={tx.categoryId ? categoryNames.get(tx.categoryId) : undefined}
                />
              </View>
            ))}
          </Card>
        </View>
      )}
    </Screen>
  );
}
