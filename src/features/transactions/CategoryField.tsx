import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { categoryIcon } from '@/ui/categoryIcons';
import { AppText, Button, Field } from '@/ui/kit';
import { SelectField } from '@/ui/SelectField';
import { space } from '@/ui/theme';
import { addCategory, listCategories } from './repository';

const NO_CATEGORY = '__none__';
const ADD_CATEGORY = '__add__';

/**
 * Category picker with “Add a category”. Used on expense and general transaction forms.
 */
export function CategoryField({
  label = 'Category',
  value,
  onChange,
  required = false,
  allowNone = true,
}: {
  label?: string;
  value: number | null;
  onChange: (id: number | null) => void;
  /** When true, Uncategorised is hidden (expenses). */
  required?: boolean;
  allowNone?: boolean;
}) {
  const [tick, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => listCategories(), [tick]);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const options = [
    ...(allowNone && !required
      ? [{ id: NO_CATEGORY, label: 'Uncategorised', icon: 'help-circle-outline' as const }]
      : []),
    ...categories.map((c) => ({ id: String(c.id), label: c.name, icon: categoryIcon(c.name) })),
    { id: ADD_CATEGORY, label: 'Add a category…', icon: 'add-circle-outline' as const },
  ];

  const saveNew = () => {
    const name = draft.trim();
    if (!name) {
      setError('Type a name for the category.');
      return;
    }
    try {
      const { id } = addCategory(name);
      setDraft('');
      setError(null);
      setAdding(false);
      refresh();
      onChange(id);
    } catch {
      setError('Could not save that category.');
    }
  };

  if (adding) {
    return (
      <View style={{ gap: space.sm }}>
        <Field
          label="New category name"
          value={draft}
          onChangeText={(v) => {
            setDraft(v);
            setError(null);
          }}
          placeholder="e.g. Church offering"
          autoCapitalize="words"
          autoFocus
          onSubmitEditing={saveNew}
        />
        {error && <AppText tone="out">{error}</AppText>}
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button title="Save category" onPress={saveNew} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Cancel"
              variant="quiet"
              onPress={() => {
                setAdding(false);
                setDraft('');
                setError(null);
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SelectField
      label={label}
      placeholder={required ? 'Choose a category' : 'Uncategorised'}
      sheetTitle={label}
      options={options}
      value={value == null ? (required ? null : NO_CATEGORY) : String(value)}
      onChange={(id) => {
        if (id === ADD_CATEGORY) {
          setAdding(true);
          return;
        }
        onChange(id === NO_CATEGORY ? null : Number(id));
      }}
    />
  );
}
