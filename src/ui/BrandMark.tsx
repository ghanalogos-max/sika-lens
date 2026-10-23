import { Image, StyleSheet, Text, View } from 'react-native';

import { brandLogo } from './brandLogos';
import { OriginalBrandIcon } from './OriginalBrandIcon';
import { brandById, brandForNetwork, type Brand } from './brands';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: number; font: number; radius: number }> = {
  sm: { box: 32, font: 10, radius: 9 },
  md: { box: 42, font: 12, radius: 12 },
  lg: { box: 52, font: 14, radius: 15 },
};

/** Official logo when we have one, otherwise a styled mark for MoMo and banks. */
export function BrandMark({
  brandId,
  network,
  brand,
  size = 'md',
  forcePlain,
}: {
  brandId?: string;
  network?: string;
  brand?: Brand;
  size?: Size;
  /** Letter tile, used where a full logo would be noise. */
  forcePlain?: boolean;
}) {
  const b = brand ?? (brandId ? brandById(brandId) : network ? brandForNetwork(network) : null) ?? brandById('other');
  const s = SIZES[size];

  if (!forcePlain && (b.kind === 'momo' || b.kind === 'bank')) {
    const logo = brandLogo(b.id);
    if (!logo) return <OriginalBrandIcon brand={b} size={size} />;
    const inset = logo.fill ? 0 : Math.round(s.box * 0.14);
    return (
      <View
        accessibilityLabel={b.name}
        style={{
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          backgroundColor: logo.bg,
          borderWidth: logo.bg === '#FFFFFF' ? StyleSheet.hairlineWidth : 0,
          borderColor: 'rgba(0,0,0,0.12)',
          overflow: 'hidden',
          padding: inset,
        }}>
        <Image source={logo.source} resizeMode={logo.fill ? 'cover' : 'contain'} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={b.name}
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        backgroundColor: b.color,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: forcePlain ? 0.55 : 1,
      }}>
      <Text style={{ color: b.onColor, fontSize: s.font, fontWeight: '800', letterSpacing: 0.3 }}>{b.short}</Text>
    </View>
  );
}
