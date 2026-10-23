import type { ProviderRules } from '../types';

// GUESSED: no real Telecel messages have been tested yet. Telecel was formerly Vodafone Ghana,
// so older messages may still say "Vodafone Cash". Replace with rules from real samples.
export const telecel: ProviderRules = {
  network: 'telecel',
  verified: false,
  hint: /\b(telecel|vodafone|voda\s?cash|t-?cash)\b/i,
  typeRules: [
    [/you have (?:sent|transferred|paid)/i, 'send'],
    [/you have received|money received/i, 'receive'],
  ],
};
