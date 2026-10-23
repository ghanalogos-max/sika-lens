import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { db } from '@/core/db/client';
import { seedIfEmpty } from '@/core/db/seed';
import { WelcomeScreen } from '@/features/entrance/WelcomeScreen';
import { CurrencyProvider } from '@/features/currency/CurrencyProvider';
import { BackdropThemeProvider } from '@/features/premium/BackdropTheme';
import { ChartThemeProvider } from '@/features/premium/ChartTheme';
import { PremiumProvider } from '@/features/premium/PremiumProvider';
import { hasEntered } from '@/features/profile/storage';
import { LockProvider, useLock } from '@/features/security/LockProvider';
import { LockScreen } from '@/features/security/LockScreen';
import { LagoonBackdrop } from '@/ui/kit';
import { ThemePreferenceProvider } from '@/ui/ThemePreference';
import { fonts, fontsFallback, useTheme } from '@/ui/theme';
import migrations from '../../drizzle/migrations';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const t = useTheme();
  const { success, error } = useMigrations(db, migrations);
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const { status } = useLock();
  const typeface = fontsReady ? fonts : fontsFallback;

  useEffect(() => {
    if (success) {
      seedIfEmpty();
      setReady(true);
    }
  }, [success]);

  useEffect(() => {
    if (!ready) return;
    void hasEntered().then((entered) => setShowWelcome(!entered));
  }, [ready]);

  useEffect(() => {
    if (fontsReady && ready) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, ready]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: t.background }}>
        <Text style={{ color: t.moneyOut, fontSize: 16, fontFamily: typeface.regular }}>
          SikaLens could not open its database: {error.message}
        </Text>
      </View>
    );
  }

  if (!fontsReady || !ready || status === 'checking' || showWelcome === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <LagoonBackdrop />
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  const locked = status === 'locked';
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style="auto" />
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={locked}
        importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.background },
            headerTintColor: t.ink,
            headerTitleStyle: { fontFamily: typeface.semibold },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: t.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-transaction" options={{ title: 'Add a transaction', presentation: 'modal' }} />
          <Stack.Screen name="edit-transaction" options={{ title: 'Edit transaction', presentation: 'modal' }} />
          <Stack.Screen name="add-salary" options={{ title: 'Log salary', presentation: 'modal' }} />
          <Stack.Screen name="import-sms" options={{ title: 'Read a MoMo message', presentation: 'modal' }} />
          <Stack.Screen name="accounts" options={{ title: 'Wallets & banks', presentation: 'modal' }} />
          <Stack.Screen name="premium" options={{ title: 'SikaLens Premium', presentation: 'modal' }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy', presentation: 'modal' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms of use', presentation: 'modal' }} />
          <Stack.Screen name="convert" options={{ title: 'Currency converter', presentation: 'modal' }} />
          <Stack.Screen name="export" options={{ title: 'Export', presentation: 'modal' }} />
        </Stack>
      </View>
      {/* Welcome is above the PIN so first-time setup (name, currency) happens before unlock. */}
      {showWelcome && <WelcomeScreen onDone={() => setShowWelcome(false)} />}
      {!showWelcome && locked && <LockScreen />}
    </View>
  );
}

export default function RootLayout() {
  const [fontsReady] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  return (
    <CurrencyProvider>
      <ThemePreferenceProvider>
        <PremiumProvider>
          <BackdropThemeProvider>
            <ChartThemeProvider>
              <LockProvider>
                <AppShell fontsReady={fontsReady} />
              </LockProvider>
            </ChartThemeProvider>
          </BackdropThemeProvider>
        </PremiumProvider>
      </ThemePreferenceProvider>
    </CurrencyProvider>
  );
}
