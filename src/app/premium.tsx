import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { usePremium } from '@/features/premium/PremiumProvider';
import { PREMIUM_PLANS, planTitle, type PremiumPlan } from '@/features/premium/pricing';
import { productIdForPlan } from '@/features/premium/products';
import { AppText, Button, Card, Screen } from '@/ui/kit';
import { fonts, radius, space, useTheme } from '@/ui/theme';

const PLAN_ORDER: PremiumPlan[] = ['weekly', 'monthly', 'annual'];

const PERKS: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }[] = [
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Full MoMo history',
    body: 'Free keeps imported messages for 30 days. Premium keeps every one.',
  },
  {
    icon: 'wallet-outline',
    title: 'Every wallet',
    body: 'Free tracks 2 wallets. Premium tracks all your MoMo and bank accounts.',
  },
  {
    icon: 'pie-chart-outline',
    title: 'Earlier months',
    body: 'Budgets, category trends, and a full-year fee total.',
  },
  {
    icon: 'color-palette-outline',
    title: 'Background & graph themes',
    body: 'Ten colour washes (Palm, Savannah, Harmattan, Ember, and more) plus matching graph colours.',
  },
  {
    icon: 'document-text-outline',
    title: 'Export',
    body: 'PDF or Excel with date ranges — share or save on this phone.',
  },
];

export default function PremiumScreen() {
  const t = useTheme();
  const router = useRouter();
  const { isPremium, plan, expiresAt, purchase, restore, cancel, storeName, storeBillingLive } = usePremium();
  const [selected, setSelected] = useState<PremiumPlan>('monthly');
  const [busy, setBusy] = useState(false);

  const runPurchase = () => {
    const p = PREMIUM_PLANS[selected];
    if (!storeBillingLive && !__DEV__) {
      Alert.alert('Coming soon', `Premium will be billed through ${storeName} in the next update.`);
      return;
    }

    const body = storeBillingLive
      ? `${p.labelUsd} ${p.period} (about ${p.labelGhs}).\n\nYou will confirm the charge in ${storeName}.\nProduct: ${productIdForPlan(selected)}`
      : `${p.labelUsd} ${p.period} (about ${p.labelGhs}).\n\nStore billing isn't live yet — this unlocks Premium on this phone only (dev builds).`;

    Alert.alert(storeBillingLive ? 'Confirm Premium' : 'Developer unlock', body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: storeBillingLive ? `Subscribe · ${p.labelUsd}` : `Unlock · ${p.labelUsd}`,
        onPress: async () => {
          setBusy(true);
          try {
            const result = await purchase(selected);
            if (result.ok) {
              router.back();
              return;
            }
            if (result.reason === 'coming_soon') {
              Alert.alert('Coming soon', result.message ?? `Billed through ${storeName} soon.`);
              return;
            }
            if (result.reason === 'cancelled') return;
            Alert.alert('Could not purchase', result.message ?? 'Try again later.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const runRestore = async () => {
    setBusy(true);
    try {
      const result = await restore();
      if (result.ok) {
        Alert.alert('Restored', 'Your Premium access is active again.');
        return;
      }
      if (result.reason === 'coming_soon') {
        Alert.alert('Restore purchases', result.message ?? `Available once ${storeName} billing is live.`);
        return;
      }
      if (result.reason === 'not_found') {
        Alert.alert('Nothing to restore', result.message ?? 'No Premium purchase found for this account.');
        return;
      }
      Alert.alert('Could not restore', result.message ?? 'Try again later.');
    } finally {
      setBusy(false);
    }
  };

  if (isPremium) {
    return (
      <Screen>
        <AppText variant="title">SikaLens Premium</AppText>
        <Card solid style={{ backgroundColor: t.goldSoft, borderColor: t.gold }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="diamond" size={22} color={t.gold} />
            <AppText variant="label" tone="gold">
              You are Premium
            </AppText>
          </View>
          <AppText tone="soft">
            {planTitle(plan)} plan
            {expiresAt ? ` · renews ${expiresAt.slice(0, 10)}` : ''}
          </AppText>
        </Card>
        {PERKS.map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Ionicons name="checkmark-circle" size={20} color={t.primary} />
            <AppText style={{ flex: 1 }}>{p.title}</AppText>
          </View>
        ))}
        <AppText variant="caption" tone="soft" style={{ textAlign: 'center' }}>
          Manage or cancel your subscription in {storeName} → Subscriptions.
        </AppText>
        {__DEV__ && (
          <Button
            title="Turn off Premium (dev)"
            variant="quiet"
            onPress={() =>
              Alert.alert('Turn off Premium?', 'Free limits apply again. Nothing already saved is deleted.', [
                { text: 'Keep', style: 'cancel' },
                { text: 'Turn off', style: 'destructive', onPress: () => void cancel() },
              ])
            }
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="diamond" size={26} color={t.gold} />
          <AppText variant="display" style={{ fontSize: 28 }}>
            Premium
          </AppText>
        </View>
        <AppText tone="soft">
          Bank and MoMo logos stay free. Prices are listed in US dollars; {storeName} charges in your local currency
          (cedi or dollars).
        </AppText>
        {!storeBillingLive && (
          <AppText variant="caption" tone="soft">
            Store billing is not live yet — production shows Coming soon.
          </AppText>
        )}
      </View>

      <View style={{ gap: space.md }}>
        {PERKS.map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: space.md }}>
            <Ionicons name={p.icon} size={22} color={t.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label">{p.title}</AppText>
              <AppText tone="soft">{p.body}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: space.sm }}>
        {PLAN_ORDER.map((id) => {
          const p = PREMIUM_PLANS[id];
          const on = selected === id;
          return (
            <Pressable
              key={id}
              onPress={() => setSelected(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                borderRadius: radius.md,
                borderWidth: on ? 2 : 1,
                borderColor: on ? t.gold : t.line,
                backgroundColor: on ? t.goldSoft : t.surface,
                padding: space.lg,
              }}>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? t.gold : t.inkSoft} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <AppText variant="label">{p.title}</AppText>
                  {p.badge && (
                    <View
                      style={{
                        backgroundColor: t.gold,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: radius.full,
                      }}>
                      <AppText variant="caption" style={{ color: '#fff', fontFamily: fonts.semibold }}>
                        {p.badge}
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText variant="caption" tone="soft">
                  {p.blurb}
                </AppText>
                <AppText variant="caption" tone="soft">
                  About {p.labelGhs}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="label">{p.labelUsd}</AppText>
                <AppText variant="caption" tone="soft">
                  {p.period}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        title={busy ? 'Working…' : `Continue · ${PREMIUM_PLANS[selected].labelUsd}`}
        variant="gold"
        onPress={runPurchase}
        disabled={busy}
      />
      <Pressable onPress={() => void runRestore()} style={{ alignSelf: 'center', padding: 8 }} disabled={busy}>
        <AppText variant="label" style={{ color: t.primary }}>
          Restore purchases
        </AppText>
      </Pressable>
      <AppText variant="caption" tone="soft" style={{ textAlign: 'center' }}>
        Billed through {storeName} at {PREMIUM_PLANS.weekly.labelUsd}/week, {PREMIUM_PLANS.monthly.labelUsd}/month, or{' '}
        {PREMIUM_PLANS.annual.labelUsd}/year. Renews until cancelled in {storeName} → Subscriptions. Logos belong to
        their owners.
      </AppText>
    </Screen>
  );
}
