export const NETWORKS = ['mtn', 'telecel', 'airteltigo', 'unknown'] as const;
export type Network = (typeof NETWORKS)[number];

export const TX_TYPES = ['expense', 'send', 'receive', 'salary', 'cash_out', 'cash_in', 'airtime', 'bill', 'other'] as const;
export type TxType = (typeof TX_TYPES)[number];

/** How salary (or similar income) landed in the user's hands. */
export const PAYMENT_CHANNELS = ['bank', 'momo', 'cash', 'other'] as const;
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

export type Direction = 'in' | 'out';

export interface ParsedSms {
  network: Network;
  type: TxType;
  direction: Direction;
  /** Principal amount in pesewas, always positive. */
  amount: number;
  /** Fees + levies + taxes charged on this transaction, in pesewas. */
  fee: number;
  balanceAfter: number | null;
  counterparty: string | null;
  /** The sender's own "Reference:" text, if the message has one. */
  note: string | null;
  /** The network's own transaction ID. Used to de-duplicate re-pasted messages. */
  externalRef: string | null;
  /** ISO 8601 UTC. Ghana is on GMT all year, so SMS local time == UTC. Null if the SMS has no date. */
  occurredAt: string | null;
  /** 0..1. Below ~0.8 the UI should make the user confirm every field. */
  confidence: number;
  raw: string;
}

export type ParseFailure = 'empty' | 'no_amount' | 'multiple_messages';
export type ParseResult = { ok: true; value: ParsedSms } | { ok: false; reason: ParseFailure };

/** Per-network tuning. Edit these when real messages don't parse. */
export interface ProviderRules {
  network: Exclude<Network, 'unknown'>;
  /**
   * true once these rules pass tests built from REAL messages of this network.
   * Unverified rules are educated guesses, so their results never score above 0.75
   * and the screen asks the user to check every field.
   */
  verified: boolean;
  /** Text that identifies the network in a message. */
  hint: RegExp;
  /** Checked BEFORE the common rules, first match wins. */
  typeRules: Array<[RegExp, TxType]>;
}
