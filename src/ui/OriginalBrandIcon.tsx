/**
 * Original SikaLens brand marks — inspired by Ghana MoMo/bank colours & shapes,
 * not copied trademark artwork. Premium-only surface.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { brandById, type Brand } from './brands';

type Size = 'sm' | 'md' | 'lg';
const BOX: Record<Size, number> = { sm: 40, md: 52, lg: 64 };

function Frame({
  brand,
  size,
  children,
}: {
  brand: Brand;
  size: Size;
  children: ReactNode;
}) {
  const box = BOX[size];
  return (
    <View
      accessibilityLabel={brand.name}
      style={{
        width: box,
        height: box,
        borderRadius: box * 0.28,
        backgroundColor: brand.color,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
      }}>
      {/* Soft highlight — gives depth beyond a flat chip */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -box * 0.35,
          left: -box * 0.2,
          width: box * 0.9,
          height: box * 0.9,
          borderRadius: box,
          backgroundColor: 'rgba(255,255,255,0.18)',
        }}
      />
      {children}
    </View>
  );
}

function Glyph({ brand, size }: { brand: Brand; size: Size }) {
  const box = BOX[size];
  const id = brand.id;

  // MoMo — distinctive shapes
  if (id === 'mtn') {
    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: box * 0.55,
            height: box * 0.22,
            borderRadius: 4,
            backgroundColor: brand.onColor,
            marginBottom: 3,
          }}
        />
        <Text style={{ color: brand.onColor, fontSize: box * 0.22, fontWeight: '900', letterSpacing: 1 }}>MTN</Text>
      </View>
    );
  }
  if (id === 'telecel') {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: box * 0.42,
            height: box * 0.42,
            borderRadius: box * 0.21,
            borderWidth: 3,
            borderColor: brand.onColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: brand.onColor, fontSize: box * 0.2, fontWeight: '900' }}>T</Text>
        </View>
      </View>
    );
  }
  if (id === 'airteltigo') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <View style={{ width: box * 0.2, height: box * 0.2, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
        <View style={{ width: box * 0.2, height: box * 0.28, borderRadius: 3, backgroundColor: '#FFFFFF', opacity: 0.85 }} />
        <Text style={{ color: brand.onColor, fontSize: box * 0.18, fontWeight: '900', marginLeft: 2 }}>AT</Text>
      </View>
    );
  }

  // Banks — shield / bar motifs so they read as “institutions”
  if (brand.kind === 'bank') {
    return (
      <View style={{ alignItems: 'center', gap: 2 }}>
        <View
          style={{
            width: box * 0.38,
            height: box * 0.28,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            backgroundColor: brand.onColor,
            opacity: 0.95,
          }}
        />
        <Text
          style={{
            color: brand.onColor,
            fontSize: Math.max(9, box * 0.18),
            fontWeight: '800',
            letterSpacing: 0.4,
          }}
          numberOfLines={1}>
          {brand.short}
        </Text>
      </View>
    );
  }

  return (
    <Text style={{ color: brand.onColor, fontSize: box * 0.28, fontWeight: '800' }}>{brand.short}</Text>
  );
}

export function OriginalBrandIcon({
  brandId,
  brand,
  size = 'md',
}: {
  brandId?: string;
  brand?: Brand;
  size?: Size;
}) {
  const b = brand ?? brandById(brandId ?? 'other');
  return (
    <Frame brand={b} size={size}>
      <Glyph brand={b} size={size} />
    </Frame>
  );
}
