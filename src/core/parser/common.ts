import { toPesewas } from '../money/money';
import type { Direction, TxType } from './types';

export interface Amounts {
  amount: number | null;
  fee: number;
  balance: number | null;
}

/**
 * Walks every "GHS 12.34" in the text and decides what it is from the words just
 * before it (balance / fee / tax / otherwise the principal amount).
 * The label window stops at the previous amount so "Fee: GHS 1.00. Balance: GHS 9.00"
 * can't leak the word "Fee" into the balance's label.
 */
export function extractAmounts(text: string): Amounts {
  let amount: number | null = null;
  let fee = 0;
  let current: number | null = null;
  let available: number | null = null;
  let prevEnd = 0;

  for (const m of text.matchAll(/(?:GH[S₵C]|₵)\s?([\d,]+(?:\.\d{1,2})?)/gi)) {
    const idx = m.index ?? 0;
    const label = text.slice(Math.max(prevEnd, idx - 40), idx).toLowerCase();
    const value = toPesewas(m[1]);
    prevEnd = idx + m[0].length;

    if (label.includes('balance')) {
      if (label.includes('available')) available = value;
      else current = value;
    } else if (/(fee|levy|tax|charge)/.test(label)) {
      fee += value;
    } else if (amount === null) {
      amount = value;
    }
  }
  // Some networks write "Tax Charged 0.50" with no "GHS". Skip the ones that DO have a currency
  // prefix: the loop above already counted those.
  for (const m of text.matchAll(/(?:tax|levy|fee)\s+charged\s*:?\s*(?![A-Za-z₵])([\d,]+(?:\.\d{1,2})?)/gi)) {
    fee += toPesewas(m[1]);
  }
  return { amount, fee, balance: available ?? current };
}

const REF_PATTERN =
  /(?:transaction|trans|txn)\s*(?:id|no\.?|number)?\s*[:.#-]?\s*((?=[A-Za-z0-9]*\d)[A-Za-z0-9]{6,})/i;

export function extractReference(text: string): string | null {
  return text.match(REF_PATTERN)?.[1] ?? null;
}

/** How many transaction IDs the text holds. More than one means several SMS were pasted together. */
export function countReferences(text: string): number {
  return [...text.matchAll(new RegExp(REF_PATTERN.source, 'gi'))].length;
}

/** The sender's own "Reference: Lunch." text. */
export function extractNote(text: string): string | null {
  return text.match(/\breference\s*:\s*([^.]{1,60}?)\s*\.(?=\s|$)/i)?.[1]?.trim() || null;
}

// A name ends at a full stop (even one glued to the next word, like "BUNDLE .Current"),
// an opening bracket (MTN adds the phone number in brackets), a comma, a keyword that starts the next field, or the end of the text.
const STOP = String.raw`(?=\s*\.(?!\d)|\s*\(|,|\s(?:current|available|balance|reference|ref|transaction|trans|txn|fee|tax|charge|on|at|with|for|via)\b|$)`;
const TO_RE = new RegExp(String.raw`\bto\s+([A-Za-z0-9][A-Za-z0-9 .'\-]{1,40}?)${STOP}`, 'i');
const FROM_RE = new RegExp(String.raw`\bfrom\s+([A-Za-z0-9][A-Za-z0-9 .'\-]{1,40}?)${STOP}`, 'i');

export function extractCounterparty(text: string, direction: Direction): string | null {
  const m = text.match(direction === 'in' ? FROM_RE : TO_RE);
  return m?.[1]?.trim() || null;
}

function toIso(y: number, mo: number, d: number, h: number, mi: number, s: number): string | null {
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  const valid =
    dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  return valid ? dt.toISOString() : null;
}

/** Understands 2026-10-20 14:32[:05] and 20/10/2026 14:32[:05] (day first). */
export function extractDate(text: string): string | null {
  let m = text.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return toIso(+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] ?? 0));

  m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return toIso(+m[3], +m[2], +m[1], +m[4], +m[5], +(m[6] ?? 0));
  return null;
}

/** Specific categories win over everything: "Payment made ... to ECG" is a bill, not a plain send. */
const SPECIFIC_TYPE_RULES: Array<[RegExp, TxType]> = [
  [/airtime|data bundle|bundle/i, 'airtime'],
  [/cash\s?out|withdraw/i, 'cash_out'],
  [/cash\s?in\b|deposit/i, 'cash_in'],
  [/\b(bill|ecg|gwcl|dstv|gotv|startimes|merchant)\b/i, 'bill'],
];

/** Last resort: just the direction of the money. */
const GENERIC_TYPE_RULES: Array<[RegExp, TxType]> = [
  [/received|receive|credited/i, 'receive'],
  [/\b(sent|send|paid|payment made|transferred|transfer)\b/i, 'send'],
];

/** Order: specific categories -> network-specific phrasing -> generic direction. */
export function classifyType(text: string, providerRules: Array<[RegExp, TxType]>): TxType {
  for (const [re, type] of [...SPECIFIC_TYPE_RULES, ...providerRules, ...GENERIC_TYPE_RULES]) {
    if (re.test(text)) return type;
  }
  return 'other';
}

export function directionFor(type: TxType): Direction {
  return type === 'receive' || type === 'cash_in' || type === 'salary' ? 'in' : 'out';
}
