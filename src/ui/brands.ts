/**
 * Brand catalogue for MoMo networks and major Ghana banks.
 * Marks use official-ish brand colours with lettermarks — not trademarked logo artwork.
 */

export type BrandKind = 'momo' | 'bank' | 'cash' | 'other';

export type Brand = {
  id: string;
  name: string;
  short: string;
  kind: BrandKind;
  /** Background of the mark */
  color: string;
  /** Text / icon on the mark */
  onColor: string;
  /** Optional MoMo network key for SMS balance sync */
  network?: 'mtn' | 'telecel' | 'airteltigo';
  /** Extra picker search terms (former names, acronyms). */
  aliases?: string[];
};

export const BRANDS: Brand[] = [
  // MoMo
  { id: 'mtn', name: 'MTN MoMo', short: 'MTN', kind: 'momo', color: '#FFCC00', onColor: '#1A1A1A', network: 'mtn' },
  { id: 'telecel', name: 'Telecel Cash', short: 'TEL', kind: 'momo', color: '#E30613', onColor: '#FFFFFF', network: 'telecel' },
  { id: 'airteltigo', name: 'AirtelTigo Money', short: 'AT', kind: 'momo', color: '#ED1C24', onColor: '#FFFFFF', network: 'airteltigo' },

  // Banks (Ghana)
  { id: 'gcb', name: 'GCB Bank', short: 'GCB', kind: 'bank', color: '#003366', onColor: '#FFFFFF' },
  { id: 'ecobank', name: 'Ecobank', short: 'ECO', kind: 'bank', color: '#0066B3', onColor: '#FFFFFF' },
  {
    id: 'absa',
    name: 'Absa Bank Ghana',
    short: 'Absa',
    kind: 'bank',
    color: '#AF0E2E',
    onColor: '#FFFFFF',
    aliases: ['Barclays', 'Absa'],
  },
  { id: 'stanbic', name: 'Stanbic Bank', short: 'STB', kind: 'bank', color: '#0033A0', onColor: '#FFFFFF' },
  { id: 'fidelity', name: 'Fidelity Bank Ghana', short: 'FID', kind: 'bank', color: '#F48221', onColor: '#FFFFFF' },
  { id: 'calbank', name: 'CalBank', short: 'CAL', kind: 'bank', color: '#E87722', onColor: '#FFFFFF' },
  { id: 'access', name: 'Access Bank', short: 'ACC', kind: 'bank', color: '#EE3124', onColor: '#FFFFFF' },
  { id: 'zenith', name: 'Zenith Bank', short: 'ZEN', kind: 'bank', color: '#ED1C24', onColor: '#FFFFFF' },
  { id: 'cbg', name: 'Consolidated Bank', short: 'CBG', kind: 'bank', color: '#0B5E2C', onColor: '#FFFFFF' },
  {
    id: 'adb',
    name: 'Agricultural Development Bank',
    short: 'ADB',
    kind: 'bank',
    color: '#006B3F',
    onColor: '#FFFFFF',
    aliases: ['ADB', 'ADB Bank', 'agricbank'],
  },
  { id: 'republic', name: 'Republic Bank', short: 'REP', kind: 'bank', color: '#C8102E', onColor: '#FFFFFF' },
  { id: 'gtbank', name: 'GTBank', short: 'GTB', kind: 'bank', color: '#E87722', onColor: '#FFFFFF' },
  { id: 'umb', name: 'UMB', short: 'UMB', kind: 'bank', color: '#003DA5', onColor: '#FFFFFF' },
  { id: 'fnb', name: 'First National Bank', short: 'FNB', kind: 'bank', color: '#00A651', onColor: '#FFFFFF' },
  {
    id: 'sg',
    name: 'Société Générale Ghana',
    short: 'SG',
    kind: 'bank',
    color: '#E60028',
    onColor: '#FFFFFF',
    aliases: ['SG-SSB', 'SSB', 'SSB Bank', 'Social Security Bank', 'Societe Generale'],
  },
  { id: 'prudential', name: 'Prudential Bank', short: 'PRU', kind: 'bank', color: '#1B4F72', onColor: '#FFFFFF' },
  { id: 'nab', name: 'National Investment Bank', short: 'NIB', kind: 'bank', color: '#1A5276', onColor: '#FFFFFF' },
  { id: 'omnibsic', name: 'OmniBSIC Bank', short: 'OMN', kind: 'bank', color: '#0D47A1', onColor: '#FFFFFF' },
  {
    id: 'boa',
    name: 'Bank of Africa Ghana',
    short: 'BOA',
    kind: 'bank',
    color: '#008C45',
    onColor: '#FFFFFF',
    aliases: ['BOA', 'Bank of Africa', 'BMCE'],
  },
  { id: 'fab', name: 'First Atlantic Bank', short: 'FAB', kind: 'bank', color: '#00695C', onColor: '#FFFFFF' },
  { id: 'uba', name: 'UBA', short: 'UBA', kind: 'bank', color: '#E30613', onColor: '#FFFFFF' },
  { id: 'fidelity_life', name: 'FBNBank', short: 'FBN', kind: 'bank', color: '#003366', onColor: '#FFFFFF' },

  // Other
  { id: 'cash', name: 'Cash', short: '₵', kind: 'cash', color: '#2B7A57', onColor: '#FFFFFF' },
  { id: 'other', name: 'Other wallet', short: '…', kind: 'other', color: '#51666B', onColor: '#FFFFFF' },
];

const byId = new Map(BRANDS.map((b) => [b.id, b]));

export function brandById(id: string): Brand {
  return byId.get(id) ?? BRANDS.find((b) => b.id === 'other')!;
}

export function brandsByKind(kind: BrandKind): Brand[] {
  return BRANDS.filter((b) => b.kind === kind);
}

export function brandForNetwork(network: string): Brand | null {
  return BRANDS.find((b) => b.network === network) ?? null;
}
