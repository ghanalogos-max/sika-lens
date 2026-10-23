import { View } from 'react-native';

import type { IonName } from '@/ui/categoryIcons';
import { Field } from '@/ui/kit';
import { SelectField } from '@/ui/SelectField';
import { EMPLOYERS, type EmployerOption } from './employers';

const NEEDS_NAME = new Set([
  'Other',
  'Private company',
  'Self-employed',
  'University or tertiary institution',
  'Religious organisation',
  'NGO or development partner',
]);

function iconFor(raw: string): IonName {
  const name = typeof raw === 'string' ? raw : '';
  if (name === 'Self-employed') return 'person-outline';
  if (name.includes('Education') || name.includes('Teaching') || name.includes('University')) return 'school-outline';
  if (name.includes('Health') || name.includes('Insurance Authority')) return 'medkit-outline';
  if (
    name.includes('Police') ||
    name.includes('Armed') ||
    name.includes('Fire') ||
    name.includes('Prisons') ||
    name.includes('Immigration') ||
    name.includes('Intelligence') ||
    name.includes('Organised Crime')
  ) {
    return 'shield-outline';
  }
  if (name.includes('Human Rights') || name.includes('Judicial') || name.includes('Electoral')) {
    return 'scale-outline';
  }
  if (
    name.includes('Bank of Ghana') ||
    name.includes('Banking') ||
    name.includes('Revenue') ||
    name.includes('Social Security')
  ) {
    return 'cash-outline';
  }
  if (
    name.includes('Electricity') ||
    name.includes('Water') ||
    name.includes('Volta') ||
    name.includes('Grid') ||
    name.includes('Petroleum')
  ) {
    return 'flash-outline';
  }
  if (name === 'Other') return 'ellipsis-horizontal';
  return 'business-outline';
}

function searchText(o: EmployerOption): string {
  return [o.name, o.short, ...(o.aliases ?? [])].filter(Boolean).join(' ');
}

export function EmployerPicker({
  employer,
  customName,
  onChange,
}: {
  employer: string;
  customName: string;
  onChange: (employer: string, customName: string) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <SelectField
        label="Employer / source"
        placeholder="Who pays you?"
        sheetTitle="Who pays you?"
        options={EMPLOYERS.map((o) => ({
          id: o.name,
          label: o.name,
          sublabel: o.short,
          icon: iconFor(o.name),
          searchText: searchText(o),
        }))}
        value={employer}
        onChange={(id) => onChange(id, customName)}
      />
      {NEEDS_NAME.has(employer) && (
        <Field
          label={
            employer === 'Self-employed'
              ? 'Business or trade name'
              : employer === 'University or tertiary institution'
                ? 'Institution name'
                : employer === 'Religious organisation' || employer === 'NGO or development partner'
                  ? 'Organisation name'
                  : 'Institution or company name'
          }
          value={customName}
          onChangeText={(v) => onChange(employer, v)}
          placeholder={
            employer === 'Self-employed'
              ? 'e.g. Ama Trading'
              : employer === 'University or tertiary institution'
                ? 'e.g. University of Ghana'
                : 'e.g. Acme Ltd'
          }
          autoCapitalize="words"
        />
      )}
    </View>
  );
}

export function resolveEmployer(employer: string, customName: string): string {
  if (!NEEDS_NAME.has(employer)) return employer;
  return customName.trim() || employer;
}
