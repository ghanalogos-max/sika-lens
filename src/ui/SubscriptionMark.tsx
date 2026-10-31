import { Image, StyleSheet, Text, View } from 'react-native';

import { subscriptionLogo } from './subscriptionLogos';
import { subscriptionPresetById, subscriptionPresetByName, type SubscriptionPreset } from '@/features/reminders/types';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: number; font: number; radius: number }> = {
  sm: { box: 32, font: 10, radius: 9 },
  md: { box: 42, font: 12, radius: 12 },
  lg: { box: 52, font: 14, radius: 15 },
};

/** Logo tile for ChatGPT, Spotify, Netflix, and other renewal presets. */
export function SubscriptionMark({
  presetId,
  name,
  preset,
  size = 'md',
}: {
  presetId?: string;
  name?: string;
  preset?: SubscriptionPreset;
  size?: Size;
}) {
  const p =
    preset ??
    (presetId ? subscriptionPresetById(presetId) : null) ??
    (name ? subscriptionPresetByName(name) : null);
  const s = SIZES[size];

  if (p) {
    const logo = subscriptionLogo(p.id);
    if (logo) {
      const inset = logo.fill ? 0 : Math.round(s.box * 0.14);
      return (
        <View
          accessibilityLabel={p.name}
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
  }

  const label = (p?.short ?? name?.slice(0, 3) ?? '?').toUpperCase();
  const bg = p?.color ?? '#51666B';
  const fg = p?.onColor ?? '#FFFFFF';
  return (
    <View
      accessibilityLabel={p?.name ?? name ?? 'Subscription'}
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: fg, fontSize: s.font, fontWeight: '800', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}
