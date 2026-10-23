import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type KeyboardEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/ui/kit';
import { SikaLogo } from '@/ui/SikaLogo';
import { fonts, radius, space, useTheme } from '@/ui/theme';

import { ENTRANCE_HERO_URI } from './heroImage';

/**
 * Immersive gate for first-open and PIN lock.
 * Keyboard: collapse brand in place (no remount), one avoidance strategy per platform,
 * then scroll the sheet into view — avoids double-lift and focus loss.
 */
export function GateShell({
  line,
  greeting,
  welcome,
  initial,
  footer,
  children,
  zIndex,
  compactSheet = false,
}: {
  line: string;
  /** Time-of-day line (e.g. Good morning). */
  greeting?: string | null;
  /** Second line (e.g. Welcome back, Ama). */
  welcome?: string | null;
  /** Avatar letter when greeting is shown. */
  initial?: string | null;
  footer?: ReactNode;
  children: ReactNode;
  zIndex: number;
  /** Tighter sheet padding (PIN login page). */
  compactSheet?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sheetY = useRef(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const revealSheet = () => {
      // Wait a frame so layout has collapsed the brand before scrolling.
      requestAnimationFrame(() => {
        const y = Math.max(0, sheetY.current - space.md);
        scrollRef.current?.scrollTo({ y, animated: true });
      });
    };

    const onShow = (_e: KeyboardEvent) => {
      setKeyboardOpen(true);
      revealSheet();
    };
    const onHide = () => {
      setKeyboardOpen(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    };

    // Android app.json uses softwareKeyboardLayoutMode "resize" — window already shrinks.
    // iOS needs KeyboardAvoidingView; we only listen here to collapse chrome + scroll.
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const brand = (
    <Animated.View
      entering={FadeInDown.delay(80).duration(560)}
      style={{
        paddingHorizontal: space.xl,
        paddingBottom: keyboardOpen ? space.sm : space.lg,
        alignItems: 'center',
        gap: keyboardOpen ? 4 : 12,
      }}>
      {keyboardOpen ? (
        <SikaLogo size="sm" showWordmark wordmarkColor="#FFFFFF" />
      ) : (
        <SikaLogo size="lg" showWordmark wordmarkColor="#FFFFFF" />
      )}
      {!keyboardOpen ? (
        <>
          <AppText
            style={{
              color: 'rgba(234, 241, 240, 0.78)',
              fontSize: 15,
              fontFamily: fonts.medium,
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
            Money on your phone, clearly
          </AppText>
          {greeting || welcome ? (
            <View
              style={{
                marginTop: space.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                paddingHorizontal: space.md,
                paddingVertical: 12,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(255,255,255,0.22)',
                alignSelf: 'stretch',
                maxWidth: 360,
              }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: t.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                <AppText style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 18 }}>
                  {(initial || 'S').charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                {greeting ? (
                  <AppText style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.semibold }} numberOfLines={1}>
                    {greeting}
                  </AppText>
                ) : null}
                {welcome ? (
                  <AppText
                    style={{ color: 'rgba(234, 241, 240, 0.88)', fontSize: 14, fontFamily: fonts.medium }}
                    numberOfLines={1}>
                    {welcome}
                  </AppText>
                ) : null}
              </View>
            </View>
          ) : null}
          <AppText
            style={{
              color: 'rgba(234, 241, 240, 0.88)',
              fontSize: 15,
              lineHeight: 22,
              fontFamily: fonts.regular,
              textAlign: 'center',
              maxWidth: 300,
              marginTop: 4,
            }}>
            {line}
          </AppText>
        </>
      ) : null}
    </Animated.View>
  );

  const body = (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bounces={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        // Keep sheet at the bottom when idle; when keyboard is open, pack from the top
        // so the sheet sits above the keyboard without fighting a second padding lift.
        justifyContent: keyboardOpen ? 'flex-start' : 'flex-end',
        paddingTop: keyboardOpen ? space.sm : space.lg,
        paddingBottom: space.md + insets.bottom,
      }}>
      {brand}

      <Animated.View
        entering={FadeInUp.delay(200).duration(520)}
        onLayout={(e) => {
          sheetY.current = e.nativeEvent.layout.y;
        }}
        style={{
          marginHorizontal: space.md,
          backgroundColor: t.surface,
          borderRadius: compactSheet ? radius.lg : radius.xl,
          paddingHorizontal: compactSheet ? space.md : space.lg,
          paddingTop: compactSheet ? space.md : space.xl,
          paddingBottom: compactSheet ? space.md : space.lg,
          gap: compactSheet ? space.sm : space.md,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
        }}>
        {children}
      </Animated.View>

      {footer ? (
        <View
          style={{
            paddingTop: space.lg,
            paddingHorizontal: space.md,
            // Hide without unmounting parent chrome; keeps layout stable.
            opacity: keyboardOpen ? 0 : 1,
            height: keyboardOpen ? 0 : undefined,
            overflow: 'hidden',
            pointerEvents: keyboardOpen ? 'none' : 'auto',
          }}>
          {footer}
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#071216', zIndex }]}>
      <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: ENTRANCE_HERO_URI }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          transition={500}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7, 18, 22, 0.28)' }]} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '32%',
          backgroundColor: 'rgba(7, 18, 22, 0.5)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '62%',
          backgroundColor: 'rgba(7, 18, 22, 0.82)',
        }}
      />

      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        {Platform.OS === 'ios' ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={insets.top}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}
