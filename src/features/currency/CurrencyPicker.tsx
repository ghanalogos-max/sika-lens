import { CURRENCIES, CURRENCY_IDS, type CurrencyId } from '@/features/currency/currencies';
import { CurrencyMark } from '@/features/currency/CurrencyMark';
import { SelectField, type SelectOption } from '@/ui/SelectField';

const OPTIONS: SelectOption[] = CURRENCY_IDS.map((id) => {
  const c = CURRENCIES[id];
  return {
    id,
    label: c.name,
    sublabel: `${c.symbol} · ${c.id}`,
    searchText: [c.name, c.symbol, c.id, c.flag].join(' '),
    leading: <CurrencyMark id={id} size="sm" />,
  };
});

/** Same sheet-style picker as banks: one logo, full name, searchable. */
export function CurrencyPicker({
  label,
  value,
  onChange,
  sheetTitle,
}: {
  label: string;
  value: CurrencyId;
  onChange: (id: CurrencyId) => void;
  sheetTitle?: string;
}) {
  return (
    <SelectField
      label={label}
      placeholder="Choose currency"
      sheetTitle={sheetTitle ?? label}
      options={OPTIONS}
      value={value}
      onChange={(id) => onChange(id as CurrencyId)}
    />
  );
}
