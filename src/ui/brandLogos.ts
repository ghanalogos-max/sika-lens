import type { ImageSourcePropType } from 'react-native';

/**
 * Official logos (assets/brands, fetched by scripts/fetch-brand-logos.ps1).
 * `bg` is the tile colour behind the logo; `fill` means the image already includes its own background.
 */
export type BrandLogo = { source: ImageSourcePropType; bg: string; fill?: boolean };

const LOGOS: Record<string, BrandLogo> = {
  // MoMo
  mtn: { source: require('../../assets/brands/mtn.jpg'), bg: '#FFCC00', fill: true },
  telecel: { source: require('../../assets/brands/telecel.png'), bg: '#E30613', fill: true },
  airteltigo: { source: require('../../assets/brands/airteltigo.png'), bg: '#FFFFFF' },

  // Banks
  gcb: { source: require('../../assets/brands/gcb.png'), bg: '#1B1464' },
  ecobank: { source: require('../../assets/brands/ecobank.png'), bg: '#FFFFFF' },
  /** Official Absa Bank Ghana mark from absa.com.gh */
  absa: { source: require('../../assets/brands/absa.png'), bg: '#000000', fill: true },
  stanbic: { source: require('../../assets/brands/stanbic.png'), bg: '#FFFFFF' },
  /** Fidelity Bank Ghana app mark — orange circle, white F */
  fidelity: { source: require('../../assets/brands/fidelity.png'), bg: '#F48221', fill: true },
  calbank: { source: require('../../assets/brands/calbank.png'), bg: '#FFFFFF' },
  access: { source: require('../../assets/brands/access.png'), bg: '#000000', fill: true },
  zenith: { source: require('../../assets/brands/zenith.png'), bg: '#FFFFFF' },
  cbg: { source: require('../../assets/brands/cbg.png'), bg: '#FFFFFF' },
  /** ADB Mobile Banking app mark — leaf + adb wordmark */
  adb: { source: require('../../assets/brands/adb.jpg'), bg: '#FFFFFF', fill: true },
  republic: { source: require('../../assets/brands/republic.png'), bg: '#FFFFFF' },
  gtbank: { source: require('../../assets/brands/gtbank.png'), bg: '#E87722', fill: true },
  umb: { source: require('../../assets/brands/umb.png'), bg: '#FFFFFF' },
  fnb: { source: require('../../assets/brands/fnb.png'), bg: '#FFFFFF' },
  /** Société Générale red/black square (Ghana; formerly SG-SSB / SSB) */
  sg: { source: require('../../assets/brands/sg.jpg'), bg: '#000000', fill: true },
  prudential: { source: require('../../assets/brands/prudential.png'), bg: '#FFFFFF' },
  nab: { source: require('../../assets/brands/nab.jpg'), bg: '#FFFFFF' },
  omnibsic: { source: require('../../assets/brands/omnibsic.png'), bg: '#FFFFFF' },
  /** Bank of Africa Ghana — official BMobile app mark (green geometric square) */
  boa: { source: require('../../assets/brands/boa.jpg'), bg: '#008C45', fill: true },
  fab: { source: require('../../assets/brands/fab.jpg'), bg: '#5B2C83', fill: true },
  uba: { source: require('../../assets/brands/uba.png'), bg: '#FFFFFF' },
  fidelity_life: { source: require('../../assets/brands/fidelity_life.png'), bg: '#FFFFFF' },
};

export function brandLogo(id: string): BrandLogo | null {
  return LOGOS[id] ?? null;
}
