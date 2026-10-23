import {
  classifyType,
  countReferences,
  directionFor,
  extractAmounts,
  extractCounterparty,
  extractDate,
  extractNote,
  extractReference,
} from './common';
import { airteltigo } from './providers/airteltigo';
import { mtn } from './providers/mtn';
import { telecel } from './providers/telecel';
import type { Network, ParseResult, ProviderRules } from './types';

export * from './types';

/** Telecel/AirtelTigo are checked first: they are more specific than the generic "momo" hint. */
const PROVIDERS: ProviderRules[] = [telecel, airteltigo, mtn];

export function detectNetwork(text: string): Network {
  return PROVIDERS.find((p) => p.hint.test(text))?.network ?? 'unknown';
}

/**
 * Turns a pasted mobile-money SMS into structured data.
 * Pure function: no React Native, no database. Safe to unit test and to reuse
 * later for Android auto-read.
 */
export function parseMomoSms(raw: string): ParseResult {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'empty' };

  // Two SMS pasted together would silently mix their amounts, fees and balances.
  if (countReferences(text) > 1) return { ok: false, reason: 'multiple_messages' };

  const { amount, fee, balance } = extractAmounts(text);
  if (amount === null) return { ok: false, reason: 'no_amount' };

  const network = detectNetwork(text);
  const rules = PROVIDERS.find((p) => p.network === network);
  const type = classifyType(text, rules?.typeRules ?? []);
  const direction = directionFor(type);
  const counterparty = extractCounterparty(text, direction);
  const externalRef = extractReference(text);
  const occurredAt = extractDate(text);

  let confidence = 0.4; // amount found
  if (type !== 'other') confidence += 0.2;
  if (externalRef) confidence += 0.15;
  if (counterparty) confidence += 0.1;
  if (balance !== null) confidence += 0.1;
  if (network !== 'unknown') confidence += 0.05;

  // Guessed rules (no real messages tested yet) never claim high confidence.
  if (rules && !rules.verified) confidence = Math.min(confidence, 0.75);

  return {
    ok: true,
    value: {
      network,
      type,
      direction,
      amount,
      fee,
      balanceAfter: balance,
      counterparty,
      note: extractNote(text),
      externalRef,
      occurredAt,
      confidence: Math.min(1, Math.round(confidence * 100) / 100),
      raw,
    },
  };
}
