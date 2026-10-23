import { Image } from 'expo-image';
import { View } from 'react-native';

import { AppText } from './kit';
import { fonts } from './theme';

type Size = 'sm' | 'md' | 'lg';

const BOX: Record<Size, number> = { sm: 36, md: 56, lg: 72 };

/**
 * Official SikaLens mark — magnifying glass + cedi from app icon assets.
 */
export function SikaLogo({
  size = 'lg',
  showWordmark = false,
  wordmarkColor = '#FFFFFF',
}: {
  size?: Size;
  showWordmark?: boolean;
  wordmarkColor?: string;
}) {
  const box = BOX[size];

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: box,
          height: box,
          borderRadius: box * 0.28,
          overflow: 'hidden',
          backgroundColor: '#0F6B73',
          shadowColor: '#0F6B73',
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
        }}
        accessibilityLabel="SikaLens">
        <Image
          source={require('../../assets/images/icon.png')}
          style={{ width: box, height: box }}
          contentFit="cover"
          transition={200}
        />
      </View>
      {showWordmark ? (
        <AppText
          style={{
            color: wordmarkColor,
            fontSize: size === 'lg' ? 34 : size === 'md' ? 22 : 16,
            lineHeight: size === 'lg' ? 38 : size === 'md' ? 26 : 20,
            letterSpacing: -0.8,
            fontFamily: fonts.bold,
            textAlign: 'center',
          }}>
          SikaLens
        </AppText>
      ) : null}
    </View>
  );
}
