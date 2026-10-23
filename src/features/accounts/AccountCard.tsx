import { Pressable, View } from 'react-native';

import type { Account } from '@/core/db/schema';
import { useFormatMoney } from '@/features/currency/useFormatMoney';
import { BrandMark } from '@/ui/BrandMark';
import { brandById } from '@/ui/brands';
import { AppText } from '@/ui/kit';
import { radius, space, useTheme } from '@/ui/theme';

export function AccountCard({
  account,
  onPress,
  compact,
}: {
  account: Account;
  onPress?: () => void;
  compact?: boolean;
}) {
  const t = useTheme();
  const money = useFormatMoney();
  const brand = brandById(account.brandId);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        backgroundColor: t.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: t.line,
        padding: compact ? space.md : space.lg,
        minWidth: compact ? 148 : undefined,
        gap: space.sm,
        opacity: pressed ? 0.9 : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <BrandMark brand={brand} size={compact ? 'sm' : 'md'} />
        <View style={{ flex: 1 }}>
          <AppText variant="label" numberOfLines={1}>
            {account.name}
          </AppText>
          <AppText variant="caption" tone="soft" numberOfLines={1}>
            {brand.name}
            {account.syncNetwork && account.syncNetwork !== 'unknown' ? ' · SMS sync' : ''}
          </AppText>
        </View>
      </View>
      <AppText variant={compact ? 'label' : 'title'}>{money.format(account.balance)}</AppText>
    </Pressable>
  );
}
