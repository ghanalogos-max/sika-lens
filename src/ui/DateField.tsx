import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { isDateInput } from '@/lib/dates';
import { useResolvedColorScheme } from '@/ui/glass';
import { AppText } from '@/ui/kit';
import { fonts, radius, space, useTheme } from '@/ui/theme';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar day → YYYY-MM-DD (matches Ghana GMT / UTC date fields). */
export function toLocalDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** YYYY-MM-DD → local Date at noon (avoids DST edge flips). */
export function fromDateInput(value: string, fallback: Date = new Date()): Date {
  if (!isDateInput(value)) return fallback;
  const [y, m, d] = value.trim().split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function displayDate(value: string): string {
  if (!isDateInput(value)) return value || 'Pick a date';
  return fromDateInput(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function displayTime(value: string): string {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return value || 'Pick a time';
  const h = +m[1];
  const mi = +m[2];
  if (h > 23 || mi > 59) return value;
  const d = new Date();
  d.setHours(h, mi, 0, 0);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fromTimeInput(value: string, base: Date = new Date()): Date {
  const m = (value.trim() || '00:00').match(/^(\d{1,2}):(\d{2})$/);
  const d = new Date(base.getTime());
  if (!m) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setHours(+m[1], +m[2], 0, 0);
  return d;
}

export function toLocalTimeInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function FieldShell({
  label,
  hint,
  icon,
  valueLabel,
  onPress,
}: {
  label: string;
  hint?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  valueLabel: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 52,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: t.line,
          backgroundColor: pressed ? t.surfaceRaised : t.surface,
          opacity: pressed ? 0.92 : 1,
        })}>
        <Ionicons name={icon} size={18} color={t.inkSoft} />
        <AppText style={{ flex: 1, fontSize: 16, fontFamily: fonts.regular }}>{valueLabel}</AppText>
        <Ionicons name="chevron-down" size={16} color={t.inkSoft} />
      </Pressable>
      {hint ? (
        <AppText variant="caption" tone="soft">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Native calendar date picker; value is YYYY-MM-DD. */
export function DateField({
  label,
  value,
  onChange,
  hint,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fromDateInput(value), [value]);

  const apply = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) onChange(toLocalDateInput(date));
  };

  return (
    <>
      <FieldShell
        label={label}
        hint={hint}
        icon="calendar-outline"
        valueLabel={displayDate(value)}
        onPress={() => setOpen(true)}
      />
      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          onChange={apply}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
            onPress={() => setOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: t.surfaceRaised,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                paddingBottom: space.xl,
                paddingTop: space.sm,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  paddingHorizontal: space.lg,
                  paddingBottom: space.sm,
                }}>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <AppText variant="label" tone="primary">
                    Done
                  </AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={selected}
                mode="date"
                display="spinner"
                themeVariant={scheme === 'dark' ? 'dark' : 'light'}
                onChange={apply}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

/** Native time picker; value is HH:MM (24h). */
export function TimeField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const t = useTheme();
  const scheme = useResolvedColorScheme();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fromTimeInput(value), [value]);

  const apply = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) onChange(toLocalTimeInput(date));
  };

  return (
    <>
      <FieldShell
        label={label}
        hint={hint}
        icon="time-outline"
        valueLabel={displayTime(value)}
        onPress={() => setOpen(true)}
      />
      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={selected} mode="time" display="default" is24Hour onChange={apply} />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
            onPress={() => setOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: t.surfaceRaised,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                paddingBottom: space.xl,
                paddingTop: space.sm,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  paddingHorizontal: space.lg,
                  paddingBottom: space.sm,
                }}>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <AppText variant="label" tone="primary">
                    Done
                  </AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={selected}
                mode="time"
                display="spinner"
                is24Hour
                themeVariant={scheme === 'dark' ? 'dark' : 'light'}
                onChange={apply}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
