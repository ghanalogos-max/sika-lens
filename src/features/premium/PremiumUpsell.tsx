import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Card } from '@/ui/kit';
import { space, useTheme } from '@/ui/theme';

export function PremiumUpsell({ title, body }: { title: string; body: string }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/premium')}>
      <Card solid style={{ backgroundColor: t.goldSoft, borderColor: t.gold }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Ionicons name="diamond" size={20} color={t.gold} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="label" tone="gold">
              {title}
            </AppText>
            <AppText variant="caption" tone="soft">
              {body}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.gold} />
        </View>
      </Card>
    </Pressable>
  );
}
