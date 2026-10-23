/**
 * Common Ghana employers / income sources — full official names, with short
 * labels for the picker so long curated names stay readable and searchable.
 */
export type EmployerOption = {
  /** Full official name stored on the salary entry. */
  name: string;
  /** Optional familiar short form shown under the name (and used in search). */
  short?: string;
  /** Extra search terms (acronyms, old names). */
  aliases?: string[];
};

export const EMPLOYERS: EmployerOption[] = [
  // Education & health
  { name: 'Ghana Education Service', short: 'GES' },
  { name: 'Ghana Health Service', short: 'GHS' },
  { name: 'National Health Insurance Authority', short: 'NHIA' },
  { name: 'University or tertiary institution' },
  { name: 'Teaching (private school)' },

  // Security & justice
  { name: 'Ghana Police Service' },
  { name: 'Ghana Armed Forces', short: 'GAF' },
  { name: 'Ghana National Fire Service', short: 'GNFS' },
  { name: 'Ghana Immigration Service', short: 'GIS' },
  { name: 'Ghana Prisons Service' },
  { name: 'Judicial Service of Ghana' },
  {
    name: 'Commission on Human Rights and Administrative Justice',
    short: 'CHRAJ',
    aliases: ['human rights', 'CHRAJ'],
  },
  { name: 'Economic and Organised Crime Office', short: 'EOCO' },
  { name: 'National Intelligence Bureau', short: 'NIB', aliases: ['Bureau of National Investigations', 'BNI'] },

  // Core civil / local government
  { name: 'Ghana Civil Service' },
  { name: 'Local Government Service', short: 'LGS' },
  { name: 'Parliament of Ghana' },
  { name: 'Electoral Commission of Ghana', short: 'EC' },
  { name: 'Audit Service of Ghana' },
  { name: "Controller and Accountant-General's Department", short: 'CAGD' },
  { name: 'Office of the Head of the Civil Service', short: 'OHCS' },

  // Revenue, pensions, statistics
  { name: 'Ghana Revenue Authority', short: 'GRA' },
  {
    name: 'Social Security and National Insurance Trust',
    short: 'SSNIT',
    aliases: ['pension'],
  },
  { name: 'Ghana Statistical Service', short: 'GSS' },
  { name: 'National Pensions Regulatory Authority', short: 'NPRA' },

  // Utilities & energy
  { name: 'Electricity Company of Ghana', short: 'ECG' },
  { name: 'Ghana Water Company Limited', short: 'GWCL' },
  { name: 'Volta River Authority', short: 'VRA' },
  { name: 'Ghana Grid Company', short: 'GRIDCo' },
  { name: 'Ghana National Petroleum Corporation', short: 'GNPC' },
  { name: 'National Petroleum Authority', short: 'NPA' },

  // Commissions & regulators
  { name: 'National Commission for Civic Education', short: 'NCCE' },
  { name: 'Lands Commission' },
  { name: 'National Communications Authority', short: 'NCA' },
  { name: 'Driver and Vehicle Licensing Authority', short: 'DVLA' },
  { name: 'National Disaster Management Organisation', short: 'NADMO' },
  { name: 'Bank of Ghana', short: 'BoG' },

  // Agriculture & industry
  { name: 'Ghana Cocoa Board', short: 'COCOBOD' },
  { name: 'Youth Employment Agency', short: 'YEA' },

  // Private / other sectors
  { name: 'Banking or finance' },
  { name: 'Telecom' },
  { name: 'Mining, oil or gas' },
  { name: 'NGO or development partner' },
  { name: 'Religious organisation' },
  { name: 'Self-employed' },
  { name: 'Private company' },
  { name: 'Other' },
];

export type EmployerPreset = (typeof EMPLOYERS)[number]['name'];
