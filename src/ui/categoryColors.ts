/**
 * Stable pastel palette for categories — same colour on pie slices, bars, and glyphs.
 */
const PALETTE = [
  '#0E6A62',
  '#C45A32',
  '#5B8DEF',
  '#D4892A',
  '#7B5EA7',
  '#2F6B3A',
  '#E06A86',
  '#4A667A',
  '#A88440',
  '#1C8A56',
  '#D4533E',
  '#3D8B8C',
] as const;

const SOFT = [
  '#D7EFEA',
  '#F5D5C8',
  '#D6E4FC',
  '#F6E7C8',
  '#E8DFF3',
  '#D4E8D7',
  '#F3D4DC',
  '#D5DEE6',
  '#E8D4A8',
  '#C8EBD9',
  '#F5D0C8',
  '#C8E4E5',
] as const;

/** Deep soft fills so category chips do not glow pastel on dark screens. */
const SOFT_DARK = [
  '#14383C',
  '#3A241C',
  '#1A2C48',
  '#3A2E14',
  '#2A2040',
  '#1A3020',
  '#3A1828',
  '#1C2830',
  '#3A3018',
  '#143828',
  '#3A2018',
  '#143838',
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % PALETTE.length;
  return hash;
}

export function categoryColor(name: string): string {
  return PALETTE[hashName(name)];
}

export function categorySoft(name: string, dark = false): string {
  return (dark ? SOFT_DARK : SOFT)[hashName(name)];
}
