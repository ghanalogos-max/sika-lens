import { Text, View } from 'react-native';

import { fonts } from '@/ui/theme';

import { CURRENCIES, type CurrencyId } from './currencies';

type Size = 'sm' | 'md';

const BOX: Record<Size, { box: number; flag: number; code: number; radius: number }> = {
  sm: { box: 32, flag: 16, code: 9, radius: 9 },
  md: { box: 40, flag: 20, code: 11, radius: 11 },
};

/** Flag (or CFA code) tile used as the currency logo in pickers and settings. */
export function CurrencyMark({ id, size = 'sm' }: { id: CurrencyId; size?: Size }) {
  const c = CURRENCIES[id];
  const s = BOX[size];
  const showCode = id === 'XOF' || id === 'XAF';
  return (
    <View
      accessibilityLabel={c.name}
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        backgroundColor: c.color,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {showCode ? (
        <Text
          style={{
            color: c.onColor,
            fontSize: s.code,
            fontFamily: fonts.bold,
            fontWeight: '700',
            letterSpacing: -0.3,
          }}>
          {id === 'XOF' ? 'CFA' : 'FCFA'}
        </Text>
      ) : (
        <Text style={{ fontSize: s.flag, lineHeight: s.flag + 2 }}>{c.flag}</Text>
      )}
    </View>
  );
}
