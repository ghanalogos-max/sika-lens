import { View } from 'react-native';

import { BrandMark } from '@/ui/BrandMark';
import { brandsByKind } from '@/ui/brands';
import { Field } from '@/ui/kit';
import { SelectField, type SelectOption } from '@/ui/SelectField';

const BANKS = brandsByKind('bank');
const CUSTOM_ID = '__custom__';

export function BankPicker({
  bankId,
  customName,
  onChange,
}: {
  bankId: string;
  customName: string;
  onChange: (bankId: string, customName: string) => void;
}) {
  const options: SelectOption[] = [
    ...BANKS.map((b) => ({
      id: b.id,
      label: b.name,
      sublabel: b.short !== b.name ? b.short : undefined,
      searchText: [b.name, b.short, ...(b.aliases ?? [])].join(' '),
      leading: <BrandMark brand={b} size="sm" />,
    })),
    { id: CUSTOM_ID, label: 'Another bank', sublabel: 'Type the name yourself', icon: 'add-circle-outline' as const },
  ];

  return (
    <View style={{ gap: 12 }}>
      <SelectField
        label="Bank"
        placeholder="Choose your bank"
        sheetTitle="Choose bank"
        options={options}
        value={bankId}
        onChange={(id) => onChange(id, id === CUSTOM_ID ? customName : '')}
      />
      {bankId === CUSTOM_ID && (
        <Field
          label="Bank name"
          value={customName}
          onChangeText={(v) => onChange(CUSTOM_ID, v)}
          placeholder="e.g. your credit union or rural bank"
          autoCapitalize="words"
          autoFocus
        />
      )}
    </View>
  );
}

export function resolveBankName(bankId: string, customName: string): string | null {
  if (bankId === CUSTOM_ID) return customName.trim() || null;
  return BANKS.find((b) => b.id === bankId)?.name ?? null;
}

export function bankBrandIdForMark(bankId: string): string {
  return bankId === CUSTOM_ID ? 'other' : bankId;
}
