import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { usePremium } from '@/features/premium/PremiumProvider';
import { PREMIUM_PLANS, planTitle, type PremiumPlan } from '@/features/premium/pricing';
import { AppText, Button, Card, Screen } from '@/ui/kit';
import { fonts, radius, space, useTheme } from '@/ui/theme';

const STORE = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
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
  const { isPremium, plan, expiresAt, subscribe, cancel } = usePremium();
  const [selected, setSelected] = useState<PremiumPlan>('monthly');
  const [busy, setBusy] = useState(false);

  const purchase = () => {
    const p = PREMIUM_PLANS[selected];
    if (!__DEV__) {
      Alert.alert('Coming soon', `Premium will be billed through ${STORE} in the next update.`);
      return;
    }
    Alert.alert(
      'Developer unlock',
      `${p.labelUsd} ${p.period} (about ${p.labelGhs}).\n\nStore billing isn't wired up yet, so this unlocks Premium on this phone only (dev builds).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Unlock · ${p.labelUsd}`,
          onPress: async () => {
            setBusy(true);
            try {
              await subscribe(selected);
              router.back();
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const restore = () =>
    Alert.alert('Restore purchases', `Purchases made with your ${STORE} account will be restored here once store billing is live.`);

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
          Manage or cancel your subscription in {STORE} → Subscriptions.
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
          Bank and MoMo logos stay free. Prices are listed in US dollars; {STORE} charges in your local currency (cedi or
          dollars).
        </AppText>
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
                    <View style={{ backgroundColor: t.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full }}>
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
        onPress={purchase}
        disabled={busy}
      />
      <Pressable onPress={restore} style={{ alignSelf: 'center', padding: 8 }}>
        <AppText variant="label" style={{ color: t.primary }}>
          Restore purchases
        </AppText>
      </Pressable>
      <AppText variant="caption" tone="soft" style={{ textAlign: 'center' }}>
        Billed through {STORE} at {PREMIUM_PLANS.weekly.labelUsd}/week, {PREMIUM_PLANS.monthly.labelUsd}/month, or{' '}
        {PREMIUM_PLANS.annual.labelUsd}/year. Renews until cancelled in {STORE} → Subscriptions. Logos belong to their
        owners.
      </AppText>
    </Screen>
  );
}
