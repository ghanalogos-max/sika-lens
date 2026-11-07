/**
 * Brand catalogue for MoMo networks, commercial banks, and community / rural banks in Ghana.
 * Marks use brand colours with lettermarks when no logo asset is present.
 */

export type BrandKind = 'momo' | 'bank' | 'cash' | 'other';

/** Commercial = universal banks; community = rural / community banks (BoG OFIs). */
export type BankSegment = 'commercial' | 'community';

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
  /** Bank grouping for the picker. Only used when kind === 'bank'. */
  segment?: BankSegment;
};

export const BRANDS: Brand[] = [
  // MoMo
  { id: 'mtn', name: 'MTN MoMo', short: 'MTN', kind: 'momo', color: '#FFCC00', onColor: '#1A1A1A', network: 'mtn' },
  { id: 'telecel', name: 'Telecel Cash', short: 'TEL', kind: 'momo', color: '#E30613', onColor: '#FFFFFF', network: 'telecel' },
  { id: 'airteltigo', name: 'AirtelTigo Money', short: 'AT', kind: 'momo', color: '#ED1C24', onColor: '#FFFFFF', network: 'airteltigo' },

  // Commercial banks (Ghana)
  { id: 'gcb', name: 'GCB Bank', short: 'GCB', kind: 'bank', segment: 'commercial', color: '#003366', onColor: '#FFFFFF' },
  { id: 'ecobank', name: 'Ecobank', short: 'ECO', kind: 'bank', segment: 'commercial', color: '#0066B3', onColor: '#FFFFFF' },
  {
    id: 'absa',
    name: 'Absa Bank Ghana',
    short: 'Absa',
    kind: 'bank',
    segment: 'commercial',
    color: '#AF0E2E',
    onColor: '#FFFFFF',
    aliases: ['Barclays', 'Absa'],
  },
  { id: 'stanbic', name: 'Stanbic Bank', short: 'STB', kind: 'bank', segment: 'commercial', color: '#0033A0', onColor: '#FFFFFF' },
  {
    id: 'standard_chartered',
    name: 'Standard Chartered Bank Ghana',
    short: 'SC',
    kind: 'bank',
    segment: 'commercial',
    color: '#0072AA',
    onColor: '#FFFFFF',
    aliases: ['Standard Chartered', 'StanChart', 'SCB', 'SC Ghana'],
  },
  { id: 'fidelity', name: 'Fidelity Bank Ghana', short: 'FID', kind: 'bank', segment: 'commercial', color: '#F48221', onColor: '#FFFFFF' },
  { id: 'calbank', name: 'CalBank', short: 'CAL', kind: 'bank', segment: 'commercial', color: '#E87722', onColor: '#FFFFFF' },
  { id: 'access', name: 'Access Bank', short: 'ACC', kind: 'bank', segment: 'commercial', color: '#EE3124', onColor: '#FFFFFF' },
  { id: 'zenith', name: 'Zenith Bank', short: 'ZEN', kind: 'bank', segment: 'commercial', color: '#ED1C24', onColor: '#FFFFFF' },
  { id: 'cbg', name: 'Consolidated Bank', short: 'CBG', kind: 'bank', segment: 'commercial', color: '#0B5E2C', onColor: '#FFFFFF' },
  {
    id: 'adb',
    name: 'Agricultural Development Bank',
    short: 'ADB',
    kind: 'bank',
    segment: 'commercial',
    color: '#006B3F',
    onColor: '#FFFFFF',
    aliases: ['ADB', 'ADB Bank', 'agricbank'],
  },
  { id: 'republic', name: 'Republic Bank', short: 'REP', kind: 'bank', segment: 'commercial', color: '#C8102E', onColor: '#FFFFFF' },
  { id: 'gtbank', name: 'GTBank', short: 'GTB', kind: 'bank', segment: 'commercial', color: '#E87722', onColor: '#FFFFFF' },
  { id: 'umb', name: 'UMB', short: 'UMB', kind: 'bank', segment: 'commercial', color: '#003DA5', onColor: '#FFFFFF' },
  { id: 'fnb', name: 'First National Bank', short: 'FNB', kind: 'bank', segment: 'commercial', color: '#00A651', onColor: '#FFFFFF' },
  {
    id: 'sg',
    name: 'Société Générale Ghana',
    short: 'SG',
    kind: 'bank',
    segment: 'commercial',
    color: '#E60028',
    onColor: '#FFFFFF',
    aliases: ['SG-SSB', 'SSB', 'SSB Bank', 'Social Security Bank', 'Societe Generale'],
  },
  { id: 'prudential', name: 'Prudential Bank', short: 'PRU', kind: 'bank', segment: 'commercial', color: '#1B4F72', onColor: '#FFFFFF' },
  { id: 'nab', name: 'National Investment Bank', short: 'NIB', kind: 'bank', segment: 'commercial', color: '#1A5276', onColor: '#FFFFFF' },
  { id: 'omnibsic', name: 'OmniBSIC Bank', short: 'OMN', kind: 'bank', segment: 'commercial', color: '#0D47A1', onColor: '#FFFFFF' },
  {
    id: 'boa',
    name: 'Bank of Africa Ghana',
    short: 'BOA',
    kind: 'bank',
    segment: 'commercial',
    color: '#008C45',
    onColor: '#FFFFFF',
    aliases: ['BOA', 'Bank of Africa', 'BMCE'],
  },
  { id: 'fab', name: 'First Atlantic Bank', short: 'FAB', kind: 'bank', segment: 'commercial', color: '#00695C', onColor: '#FFFFFF' },
  { id: 'uba', name: 'UBA', short: 'UBA', kind: 'bank', segment: 'commercial', color: '#E30613', onColor: '#FFFFFF' },
  { id: 'fidelity_life', name: 'FBNBank', short: 'FBN', kind: 'bank', segment: 'commercial', color: '#003366', onColor: '#FFFFFF' },
  {
    id: 'ghl',
    name: 'GHL Bank',
    short: 'GHL',
    kind: 'bank',
    segment: 'commercial',
    color: '#C8102E',
    onColor: '#FFFFFF',
    aliases: ['Ghana Home Loans', 'GHL'],
  },

  // Community & rural banks (BoG licensed OFIs — lettermark colours)
  {
    id: 'arb_apex',
    name: 'ARB Apex Bank',
    short: 'ARB',
    kind: 'bank',
    segment: 'community',
    color: '#0B5E2C',
    onColor: '#FFFFFF',
    aliases: ['Apex Bank', 'ARB', 'Rural banks apex'],
  },
  {
    id: 'abokobi',
    name: 'Abokobi Area Rural Bank',
    short: 'AAR',
    kind: 'bank',
    segment: 'community',
    color: '#1B5E20',
    onColor: '#FFFFFF',
    aliases: ['Abokobi'],
  },
  {
    id: 'ada_rural',
    name: 'Ada Rural Bank',
    short: 'Ada',
    kind: 'bank',
    segment: 'community',
    color: '#00695C',
    onColor: '#FFFFFF',
    aliases: ['Ada'],
  },
  {
    id: 'adansi',
    name: 'Adansi Rural Bank',
    short: 'ADS',
    kind: 'bank',
    segment: 'community',
    color: '#2E7D32',
    onColor: '#FFFFFF',
  },
  {
    id: 'adonten',
    name: 'Adonten Community Bank',
    short: 'ADC',
    kind: 'bank',
    segment: 'community',
    color: '#1565C0',
    onColor: '#FFFFFF',
    aliases: ['Adonten', 'New Tafo'],
  },
  {
    id: 'ahafo_community',
    name: 'Ahafo Community Bank',
    short: 'AHA',
    kind: 'bank',
    segment: 'community',
    color: '#00695C',
    onColor: '#FFFFFF',
    aliases: ['Ahafo', 'Kukuom'],
  },
  {
    id: 'ahantaman',
    name: 'Ahantaman Rural Bank',
    short: 'AHT',
    kind: 'bank',
    segment: 'community',
    color: '#0277BD',
    onColor: '#FFFFFF',
  },
  {
    id: 'akuapem',
    name: 'Akuapem Rural Bank',
    short: 'AKU',
    kind: 'bank',
    segment: 'community',
    color: '#283593',
    onColor: '#FFFFFF',
    aliases: ['Mamfe'],
  },
  {
    id: 'amantin_kasei',
    name: 'Amantin & Kasei Community Bank',
    short: 'AKC',
    kind: 'bank',
    segment: 'community',
    color: '#4527A0',
    onColor: '#FFFFFF',
    aliases: ['Amantin', 'Kasei', 'Amaka'],
  },
  {
    id: 'amenfiman',
    name: 'Amenfiman Rural Bank',
    short: 'AMF',
    kind: 'bank',
    segment: 'community',
    color: '#00695C',
    onColor: '#FFFFFF',
  },
  {
    id: 'anlo',
    name: 'Anlo Rural Bank',
    short: 'ANL',
    kind: 'bank',
    segment: 'community',
    color: '#C62828',
    onColor: '#FFFFFF',
    aliases: ['Anloga'],
  },
  {
    id: 'atwima_kwanwoma',
    name: 'Atwima Kwanwoma Rural Bank',
    short: 'AKR',
    kind: 'bank',
    segment: 'community',
    color: '#2E7D32',
    onColor: '#FFFFFF',
    aliases: ['Atwima', 'Kwanwoma'],
  },
  {
    id: 'bosomtwe',
    name: 'Bosomtwe Rural Bank',
    short: 'BOS',
    kind: 'bank',
    segment: 'community',
    color: '#1565C0',
    onColor: '#FFFFFF',
  },
  {
    id: 'builsa',
    name: 'Builsa Community Bank',
    short: 'BUI',
    kind: 'bank',
    segment: 'community',
    color: '#5D4037',
    onColor: '#FFFFFF',
    aliases: ['Builsa'],
  },
  {
    id: 'ga_rural',
    name: 'Ga Rural Bank',
    short: 'Ga',
    kind: 'bank',
    segment: 'community',
    color: '#0D47A1',
    onColor: '#FFFFFF',
    aliases: ['Ga'],
  },
  {
    id: 'kakum',
    name: 'Kakum Rural Bank',
    short: 'KAK',
    kind: 'bank',
    segment: 'community',
    color: '#00695C',
    onColor: '#FFFFFF',
  },
  {
    id: 'kwamanman',
    name: 'Kwamanman Rural Bank',
    short: 'KWA',
    kind: 'bank',
    segment: 'community',
    color: '#AD1457',
    onColor: '#FFFFFF',
  },
  {
    id: 'lower_pra',
    name: 'Lower Pra Rural Bank',
    short: 'LPR',
    kind: 'bank',
    segment: 'community',
    color: '#0277BD',
    onColor: '#FFFFFF',
    aliases: ['Pra'],
  },
  {
    id: 'nsoatreman',
    name: 'Nsoatreman Rural Bank',
    short: 'NSO',
    kind: 'bank',
    segment: 'community',
    color: '#558B2F',
    onColor: '#FFFFFF',
  },
  {
    id: 'odotobri',
    name: 'Odotobri Rural Bank',
    short: 'ODO',
    kind: 'bank',
    segment: 'community',
    color: '#6A1B9A',
    onColor: '#FFFFFF',
  },
  {
    id: 'south_akim',
    name: 'South Akim Rural Bank',
    short: 'SAK',
    kind: 'bank',
    segment: 'community',
    color: '#2E7D32',
    onColor: '#FFFFFF',
    aliases: ['Akim'],
  },
  {
    id: 'upper_manya',
    name: 'Upper Manya Kro Rural Bank',
    short: 'UMK',
    kind: 'bank',
    segment: 'community',
    color: '#BF360C',
    onColor: '#FFFFFF',
    aliases: ['Manya Kro', 'Upper Manya'],
  },

  // Custom / international — any country MoMo or bank with your own display name
  {
    id: 'custom_momo',
    name: 'My mobile money',
    short: 'MM',
    kind: 'momo',
    color: '#0F6B73',
    onColor: '#FFFFFF',
    aliases: ['custom momo', 'other momo', 'mobile money', 'mpesa', 'orange money', 'wave', 'opay'],
  },
  {
    id: 'custom_bank',
    name: 'My bank',
    short: 'Bank',
    kind: 'bank',
    segment: 'commercial',
    color: '#1C2430',
    onColor: '#FFFFFF',
    aliases: ['custom bank', 'other bank', 'international bank', 'foreign bank'],
  },

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

export function banksBySegment(segment: BankSegment): Brand[] {
  return BRANDS.filter((b) => b.kind === 'bank' && (b.segment ?? 'commercial') === segment);
}

export function brandForNetwork(network: string): Brand | null {
  return BRANDS.find((b) => b.network === network) ?? null;
}
