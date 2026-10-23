import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText, Button } from '@/ui/kit';
import { radius, space, useTheme } from '@/ui/theme';

const PIN_LEN = 4;

/**
 * Four-digit PIN entry: visible slots, number pad overlaid so digits stay on screen.
 * Auto-submits when all four are entered. `onSubmit` returns an error message, or null.
 */
export function PinPrompt({
  title,
  hint,
  submitLabel = 'Continue',
  onSubmit,
  onCancel,
  compact = false,
}: {
  title: string;
  hint?: string;
  submitLabel?: string;
  onSubmit: (pin: string) => Promise<string | null> | string | null;
  onCancel?: () => void;
  /** Tighter layout for the dedicated login PIN page. */
  compact?: boolean;
}) {
  const t = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  const slotW = compact ? 44 : 54;
  const slotH = compact ? 48 : 58;
  const gap = compact ? 8 : 12;

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    const id = setTimeout(focusInput, 280);
    return () => clearTimeout(id);
  }, []);

  const runShake = () => {
    shake.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 45 }),
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  };

  const submit = async (value: string) => {
    if (busy || value.length !== PIN_LEN) return;
    setBusy(true);
    const message = await onSubmit(value);
    setBusy(false);
    setError(message);
    if (message) {
      setPin('');
      runShake();
      setTimeout(focusInput, 50);
    }
  };

  const onChange = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, PIN_LEN);
    setPin(next);
    if (error) setError(null);
    if (next.length === PIN_LEN) void submit(next);
  };

  return (
    <View style={{ gap: compact ? space.sm : space.md }}>
      <View style={{ gap: 2 }}>
        <AppText variant="title" style={{ fontSize: compact ? 18 : 20 }}>
          {title}
        </AppText>
        {hint ? (
          <AppText tone="soft" variant="caption">
            {hint}
          </AppText>
        ) : null}
      </View>

      <Animated.View style={shakeStyle}>
        <Pressable onPress={focusInput} accessibilityRole="button" accessibilityLabel="PIN entry">
          <View style={{ position: 'relative' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap }} pointerEvents="none">
              {Array.from({ length: PIN_LEN }, (_, i) => {
                const filled = i < pin.length;
                const active = focused && i === pin.length && pin.length < PIN_LEN;
                return (
                  <View
                    key={i}
                    style={{
                      width: slotW,
                      height: slotH,
                      borderRadius: radius.sm,
                      borderWidth: filled || active ? 1.5 : 1,
                      borderColor: filled || active ? t.primary : t.line,
                      backgroundColor: filled ? t.primarySoft : t.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {filled ? (
                      <View
                        style={{
                          width: compact ? 10 : 12,
                          height: compact ? 10 : 12,
                          borderRadius: 6,
                          backgroundColor: t.primary,
                        }}
                      />
                    ) : active ? (
                      <View
                        style={{
                          width: 2,
                          height: compact ? 18 : 22,
                          borderRadius: 1,
                          backgroundColor: t.primary,
                          opacity: 0.9,
                        }}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>

            <TextInput
              ref={inputRef}
              value={pin}
              onChangeText={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="number-pad"
              maxLength={PIN_LEN}
              caretHidden
              autoCorrect={false}
              importantForAutofill="no"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              accessibilityLabel="PIN"
              showSoftInputOnFocus
              blurOnSubmit={false}
              onSubmitEditing={() => void submit(pin)}
              style={[
                StyleSheet.absoluteFill,
                {
                  color: 'transparent',
                  backgroundColor: 'transparent',
                  fontSize: 1,
                  opacity: 0.02,
                },
              ]}
            />
          </View>
        </Pressable>
      </Animated.View>

      {error ? (
        <AppText tone="out" style={{ textAlign: 'center' }} variant="caption">
          {error}
        </AppText>
      ) : (
        <AppText variant="caption" tone="soft" style={{ textAlign: 'center' }}>
          {pin.length === 0 ? '4-digit PIN' : `${pin.length} of 4`}
        </AppText>
      )}

      <Button title={submitLabel} onPress={() => void submit(pin)} disabled={busy || pin.length !== PIN_LEN} />
      {onCancel ? <Button title="Back" variant="quiet" onPress={onCancel} /> : null}
    </View>
  );
}
