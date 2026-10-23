import type { ProviderRules } from '../types';

export const mtn: ProviderRules = {
  network: 'mtn',
  verified: true, // tuned against real MTN messages (see fixtures marked REAL)
  // Real MTN messages don't always say "MTN", so their wording counts as a signature too.
  hint: /\b(mtn|momo|y['’]?ello)\b|financial transaction id|payment received for|cash out made for|payment for ghs/i,
  typeRules: [
    [/payment\s+received/i, 'receive'],
    [/payment\s+made/i, 'send'],
  ],
};
