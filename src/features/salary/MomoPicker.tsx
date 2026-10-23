import type { Network } from '@/core/parser/types';
import { BrandMark } from '@/ui/BrandMark';
import { brandsByKind } from '@/ui/brands';
import { SelectField } from '@/ui/SelectField';

const MOMO = brandsByKind('momo');

export function MomoPicker({
  network,
  onChange,
}: {
  network: Network;
  onChange: (network: Exclude<Network, 'unknown'>) => void;
}) {
  return (
    <SelectField
      label="MoMo network"
      placeholder="Choose network"
      sheetTitle="Choose MoMo network"
      options={MOMO.map((b) => ({ id: b.network!, label: b.name, leading: <BrandMark brand={b} size="sm" /> }))}
      value={network === 'unknown' ? null : network}
      onChange={(id) => onChange(id as Exclude<Network, 'unknown'>)}
    />
  );
}
