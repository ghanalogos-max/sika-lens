import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/ui/kit';
import type { IonName } from '@/ui/categoryIcons';
import { fonts, space } from '@/ui/theme';

/** Soft icon strip under the entrance sheet — atmosphere, not navigation. */
export function GateFooter({
  items,
}: {
  items: { icon: IonName; label: string }[];
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: space.sm }}>
      {items.map((item) => (
        <View key={item.label} style={{ alignItems: 'center', gap: 8, flex: 1, maxWidth: 88 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: 'rgba(224, 169, 74, 0.85)',
              backgroundColor: 'rgba(14, 106, 98, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name={item.icon} size={22} color="#E0A94A" />
          </View>
          <AppText
            style={{
              color: 'rgba(234, 241, 240, 0.88)',
              fontSize: 11,
              lineHeight: 14,
              textAlign: 'center',
              fontFamily: fonts.medium,
            }}
            numberOfLines={2}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
