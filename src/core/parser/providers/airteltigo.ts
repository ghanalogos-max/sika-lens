import type { ProviderRules } from '../types';

// GUESSED: no real AirtelTigo messages have been tested yet. Replace with rules from real samples.
export const airteltigo: ProviderRules = {
  network: 'airteltigo',
  verified: false,
  hint: /\b(airteltigo|airtel\s?tigo|airtel(?:\s?money)?|at\s?money|tigo\s?cash)\b/i,
  typeRules: [
    [/you have (?:sent|transferred|paid)/i, 'send'],
    [/you have received|money received/i, 'receive'],
  ],
};
