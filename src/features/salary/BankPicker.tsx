import { View } from 'react-native';

import { BrandMark } from '@/ui/BrandMark';
import { banksBySegment } from '@/ui/brands';
import { Field } from '@/ui/kit';
import { SelectField, type SelectOption } from '@/ui/SelectField';

const COMMERCIAL = banksBySegment('commercial');
const COMMUNITY = banksBySegment('community');
const CUSTOM_ID = '__custom__';

function bankOption(b: (typeof COMMERCIAL)[number]): SelectOption {
  return {
    id: b.id,
    label: b.name,
    sublabel: b.segment === 'community' ? 'Community / rural bank' : b.short !== b.name ? b.short : undefined,
    searchText: [b.name, b.short, b.segment === 'community' ? 'community rural' : '', ...(b.aliases ?? [])].join(' '),
    leading: <BrandMark brand={b} size="sm" />,
  };
}

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
    { id: '__hdr_commercial__', label: 'Commercial banks', section: true },
    ...COMMERCIAL.map(bankOption),
    { id: '__hdr_community__', label: 'Community & rural banks', section: true },
    ...COMMUNITY.map(bankOption),
    {
      id: CUSTOM_ID,
      label: 'Another bank',
      sublabel: 'Credit union, susu, or bank not listed',
      icon: 'add-circle-outline' as const,
      searchText: 'another custom credit union susu rural community',
    },
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
  return [...COMMERCIAL, ...COMMUNITY].find((b) => b.id === bankId)?.name ?? null;
}

export function bankBrandIdForMark(bankId: string): string {
  return bankId === CUSTOM_ID ? 'other' : bankId;
}
