import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IonName } from './categoryIcons';
import { GlassSurface } from './GlassSurface';
import { AppText } from './kit';
import { fonts, radius, space, useTheme } from './theme';

export type SelectOption = {
  id: string;
  label: string;
  sublabel?: string;
  /** Extra text matched by search (acronyms, aliases). Defaults to label + sublabel. */
  searchText?: string;
  /** Custom leading element (brand logo); takes priority over `icon`. */
  leading?: ReactNode;
  icon?: IonName;
};

/**
 * Form-style select: shows the chosen value in one field; tapping opens a sheet with every option.
 * Lists longer than 7 options get a search box.
 */
export function SelectField({
  label,
  placeholder = 'Choose…',
  options,
  value,
  onChange,
  sheetTitle,
  sheetFooter,
}: {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  sheetTitle?: string;
  sheetFooter?: ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.id === value) ?? null;
  const searchable = options.length > 7;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.searchText ?? `${o.label} ${o.sublabel ?? ''}`).toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const leadingFor = (o: SelectOption, active: boolean) =>
    o.leading ??
    (o.icon ? (
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          backgroundColor: active ? t.primary : t.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name={o.icon} size={18} color={active ? t.onPrimary : t.primary} />
      </View>
    ) : null);

  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          minHeight: 52,
          paddingHorizontal: space.md,
          paddingVertical: 8,
          borderRadius: radius.md,
          borderWidth: open ? 1.5 : 1,
          borderColor: open ? t.primary : t.line,
          backgroundColor: open || pressed ? t.surfaceRaised : t.surface,
          shadowColor: t.primary,
          shadowOpacity: open ? 0.14 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        })}>
        {selected ? leadingFor(selected, false) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText numberOfLines={2} tone={selected ? 'ink' : 'soft'}>
            {selected?.label ?? placeholder}
          </AppText>
          {selected?.sublabel ? (
            <AppText variant="caption" tone="soft" numberOfLines={1}>
              {selected.sublabel}
            </AppText>
          ) : null}
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: open ? t.primarySoft : t.background,
          }}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={open ? t.primary : t.inkSoft} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(4, 14, 17, 0.45)' }} onPress={close} />
        <GlassSurface
          style={{
            maxHeight: '78%',
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            paddingTop: space.sm,
            paddingBottom: Math.max(insets.bottom, space.lg),
          }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: t.line, marginBottom: space.sm }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.sm }}>
            <AppText variant="title" style={{ flex: 1, fontSize: 19 }}>
              {sheetTitle ?? label}
            </AppText>
            <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={t.inkSoft} />
            </Pressable>
          </View>

          {searchable && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginHorizontal: space.lg,
                marginBottom: space.sm,
                paddingHorizontal: space.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: t.line,
                backgroundColor: t.background,
              }}>
              <Ionicons name="search" size={16} color={t.primary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name or short form"
                placeholderTextColor={t.inkSoft}
                style={{ flex: 1, paddingVertical: 12, fontSize: 16, fontFamily: fonts.regular, color: t.ink }}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={t.inkSoft} />
                </Pressable>
              ) : null}
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(o) => o.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: space.sm }}
            renderItem={({ item }) => {
              const active = item.id === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    close();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingVertical: 10,
                    paddingHorizontal: space.md,
                    borderRadius: radius.sm,
                    backgroundColor: active ? t.primarySoft : pressed ? t.surfaceRaised : 'transparent',
                  })}>
                  {leadingFor(item, active)}
                  <View style={{ flex: 1, minWidth: 0, paddingRight: space.xs }}>
                    <AppText variant="label" style={{ color: active ? t.primary : t.ink }} numberOfLines={3}>
                      {item.label}
                    </AppText>
                    {item.sublabel ? (
                      <AppText variant="caption" tone="soft" numberOfLines={1}>
                        {item.sublabel}
                      </AppText>
                    ) : null}
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={t.primary} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <AppText tone="soft" style={{ textAlign: 'center', padding: space.lg }}>
                Nothing matches “{query}”.
              </AppText>
            }
          />
          {sheetFooter ? <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>{sheetFooter}</View> : null}
        </GlassSurface>
      </Modal>
    </View>
  );
}
