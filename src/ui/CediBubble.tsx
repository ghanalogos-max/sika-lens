import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResolvedColorScheme } from './glass';
import { useTheme } from './theme';

/** Soft GH₵200 wash — terracotta notes for light/dark home chrome. */
const BUBBLE = require('../../assets/images/cedi-200-bubble.png');

/**
 * Faint money orb behind home chrome — visible wash, not a sharp sticker.
 */
export function CediBubble({
  size = 220,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const dark = useResolvedColorScheme() === 'dark';
  const back = size * 0.72;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, opacity: dark ? 0.42 : 0.55 }, style]}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          left: -size * 0.16,
          width: back,
          height: back,
          borderRadius: back / 2,
          backgroundColor: t.goldSoft,
          opacity: dark ? 0.55 : 0.7,
        }}
      />
      <Image source={BUBBLE} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}
