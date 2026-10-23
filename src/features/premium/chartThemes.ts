export const CHART_THEME_IDS = [
  'lagoon',
  'cocoa',
  'berry',
  'ocean',
  'ink',
  'palm',
  'savannah',
  'harmattan',
  'slate',
  'ember',
] as const;
export type ChartThemeId = (typeof CHART_THEME_IDS)[number];

/** Fixed colours for Premium graph themes. Lagoon follows the app theme instead. */
export const CHART_THEME_META: Record<
  ChartThemeId,
  { name: string; swatch: string; line: string; forecast: string }
> = {
  lagoon: { name: 'Lagoon', swatch: '#0E6A62', line: '#0E6A62', forecast: '#C4922A' },
  cocoa: { name: 'Cocoa', swatch: '#D4892A', line: '#D4892A', forecast: '#F0C56E' },
  berry: { name: 'Berry', swatch: '#E06A86', line: '#E06A86', forecast: '#F3B4C2' },
  ocean: { name: 'Ocean', swatch: '#5B8DEF', line: '#5B8DEF', forecast: '#A9C8FF' },
  ink: { name: 'Ink', swatch: '#7D8B99', line: '#7D8B99', forecast: '#C5CDD6' },
  palm: { name: 'Palm', swatch: '#2F6B3A', line: '#2F6B3A', forecast: '#9AD0A4' },
  savannah: { name: 'Savannah', swatch: '#6B7C3C', line: '#6B7C3C', forecast: '#C8D488' },
  harmattan: { name: 'Harmattan', swatch: '#C4A574', line: '#A88440', forecast: '#E8D4A8' },
  slate: { name: 'Slate', swatch: '#4A667A', line: '#4A667A', forecast: '#A8C0D0' },
  ember: { name: 'Ember', swatch: '#C45A32', line: '#C45A32', forecast: '#F0A888' },
};

export function isChartThemeId(value: string | null): value is ChartThemeId {
  return value != null && (CHART_THEME_IDS as readonly string[]).includes(value);
}
