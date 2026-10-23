import { and, asc, desc, eq, gte, isNull, or } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { DEFAULT_CATEGORY_BY_TYPE } from '@/core/db/seed';
import {
  categories,
  recipientRules,
  transactions,
  type NewTransaction,
  type Transaction,
} from '@/core/db/schema';
import {
  addAccountBalance,
  applySmsBalance,
  findAccountBySyncNetwork,
  listAccounts,
  updateAccountBalance,
} from '@/features/accounts/repository';

const normalise = (name: string) => name.trim().toLowerCase();

function asPesewas(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** expo-sqlite and better-sqlite3 disagree on the insert-id property name. */
function insertedId(res: { lastInsertRowId?: number; lastInsertRowid?: number }): number | null {
  const id = res.lastInsertRowId ?? res.lastInsertRowid;
  return id != null && id > 0 ? id : null;
}

/**
 * Wallet balance change for one entry (no SMS balanceAfter):
 *  - In  → +amount − fee  (fee, if any, still leaves the wallet)
 *  - Out → −(amount + fee)
 */
export function walletDelta(direction: 'in' | 'out', amount: number, fee = 0): number {
  const a = asPesewas(amount);
  const f = asPesewas(fee);
  return direction === 'in' ? a - f : -(a + f);
}

export function listCategories() {
  return db.select().from(categories).orderBy(categories.name).all();
}

/**
 * Creates a category, or returns the existing one when the name already matches
 * (case-insensitive). Names are trimmed and collapsed whitespace.
 */
export function addCategory(name: string): { id: number; created: boolean } {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Category name is empty');
  const existing = listCategories().find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return { id: existing.id, created: false };
  db.insert(categories).values({ name: trimmed, isDefault: false }).run();
  const row = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, trimmed))
    .get();
  return { id: row!.id, created: true };
}

/** Ensures the Salary category exists (for upgrades and salary logging). */
export function ensureSalaryCategoryId(): number {
  const existing = db.select().from(categories).where(eq(categories.name, 'Salary')).get();
  if (existing) return existing.id;
  db.insert(categories).values({ name: 'Salary', isDefault: true }).run();
  return db.select().from(categories).where(eq(categories.name, 'Salary')).get()!.id;
}

export function suggestCategoryId(counterparty: string | null | undefined): number | null {
  if (!counterparty?.trim()) return null;
  const rule = db
    .select()
    .from(recipientRules)
    .where(eq(recipientRules.counterparty, normalise(counterparty)))
    .get();
  return rule?.categoryId ?? null;
}

function defaultCategoryIdFor(type: NewTransaction['type']): number | null {
  const name = DEFAULT_CATEGORY_BY_TYPE[type];
  if (!name) return null;
  return db.select().from(categories).where(eq(categories.name, name)).get()?.id ?? null;
}

function rememberRecipient(counterparty: string, categoryId: number) {
  db.insert(recipientRules)
    .values({ counterparty: normalise(counterparty), categoryId })
    .onConflictDoUpdate({ target: recipientRules.counterparty, set: { categoryId } })
    .run();
}

/** Prefer the chosen wallet; otherwise the MoMo wallet that syncs this network. */
function resolveWalletId(
  network: NewTransaction['network'] | undefined,
  opts?: { accountId?: number | null },
): number | null {
  if (opts !== undefined) {
    if (opts.accountId != null) return opts.accountId;
    return null;
  }
  if (network && network !== 'unknown') {
    return findAccountBySyncNetwork(network)?.id ?? null;
  }
  return null;
}

function walletIdForRow(tx: Pick<Transaction, 'accountId' | 'network'>): number | null {
  if (tx.accountId != null) return tx.accountId;
  if (tx.network !== 'unknown') return findAccountBySyncNetwork(tx.network)?.id ?? null;
  return null;
}

/** Undo a prior wallet effect (SMS absolute balances are left alone). */
function reverseWalletEffect(tx: Transaction) {
  if (tx.balanceAfter != null) return;
  const walletId = walletIdForRow(tx);
  if (walletId == null) return;
  addAccountBalance(walletId, -walletDelta(tx.direction, tx.amount, tx.fee ?? 0));
}

/** Apply wallet effect for a saved row (same rules as addTransaction). */
function applyWalletEffect(
  tx: Pick<Transaction, 'direction' | 'amount' | 'fee' | 'network' | 'balanceAfter' | 'accountId'>,
  walletId: number | null,
) {
  if (tx.balanceAfter != null && tx.network && tx.network !== 'unknown') {
    const sync = findAccountBySyncNetwork(tx.network);
    if (sync) {
      applySmsBalance(tx.network, tx.balanceAfter);
    } else if (walletId != null) {
      updateAccountBalance(walletId, asPesewas(tx.balanceAfter));
    }
    return;
  }
  if (walletId != null) {
    addAccountBalance(walletId, walletDelta(tx.direction, tx.amount, tx.fee ?? 0));
  }
}

export interface AddResult {
  /** false when the same network + transaction ID was already saved. */
  inserted: boolean;
  id: number | null;
}

export function addTransaction(
  input: NewTransaction,
  opts?: { accountId?: number | null },
): AddResult {
  const categoryId =
    input.categoryId ?? suggestCategoryId(input.counterparty) ?? defaultCategoryIdFor(input.type);

  const walletId = resolveWalletId(input.network, opts);
  // Keep any accountId already on the row (imports), else the wallet we touch.
  const accountId = input.accountId ?? walletId;

  const res = db
    .insert(transactions)
    .values({ ...input, categoryId, accountId })
    .onConflictDoNothing()
    .run();

  const inserted = res.changes > 0;
  if (inserted && input.categoryId && input.counterparty?.trim()) {
    rememberRecipient(input.counterparty, input.categoryId);
  }
  if (inserted) {
    applyWalletEffect(
      {
        direction: input.direction,
        amount: input.amount,
        fee: input.fee ?? 0,
        network: input.network ?? 'unknown',
        balanceAfter: input.balanceAfter ?? null,
        accountId,
      },
      walletId,
    );
  }
  if (!inserted) return { inserted: false, id: null };
  let id = insertedId(res);
  if (id == null && input.externalRef) {
    id =
      db
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.externalRef, input.externalRef))
        .orderBy(desc(transactions.id))
        .limit(1)
        .get()?.id ?? null;
  }
  if (id == null) {
    id =
      db
        .select({ id: transactions.id })
        .from(transactions)
        .orderBy(desc(transactions.id))
        .limit(1)
        .get()?.id ?? null;
  }
  return { inserted: true, id };
}

/**
 * Removes the row and undoes the wallet change when the entry used +/- math
 * (no SMS balanceAfter). Absolute SMS balances are left as they are.
 */
export function deleteTransaction(id: number) {
  const tx = db.select().from(transactions).where(eq(transactions.id, id)).get();
  if (!tx) return;
  reverseWalletEffect(tx);
  db.delete(transactions).where(eq(transactions.id, id)).run();
}

export function getTransaction(id: number): Transaction | null {
  const row = db.select().from(transactions).where(eq(transactions.id, id)).get();
  return row ?? null;
}

export type UpdateTransactionInput = Pick<
  NewTransaction,
  | 'amount'
  | 'fee'
  | 'direction'
  | 'type'
  | 'network'
  | 'counterparty'
  | 'categoryId'
  | 'note'
  | 'occurredAt'
  | 'paymentChannel'
  | 'employer'
> & {
  accountId?: number | null;
};

/**
 * Edits a row and keeps the wallet in step:
 *  - Normal +/- entries: reverse the old effect, then apply the new one (opening balances stay).
 *  - SMS absolute balance lines: rewrite the row, then rebuild affected wallets from their ledger
 *    (absolute lines cannot be “undone” with a simple reverse).
 */
export function updateTransaction(id: number, input: UpdateTransactionInput): boolean {
  const old = getTransaction(id);
  if (!old) return false;

  const categoryId =
    input.categoryId ?? suggestCategoryId(input.counterparty) ?? defaultCategoryIdFor(input.type);
  const walletId = resolveWalletId(input.network, { accountId: input.accountId ?? null });
  const accountId =
    input.accountId !== undefined ? input.accountId : (walletId ?? old.accountId);

  // Keep SMS balanceAfter only when money / direction / network did not change.
  const keepBalanceAfter =
    old.balanceAfter != null &&
    asPesewas(old.amount) === asPesewas(input.amount) &&
    asPesewas(old.fee) === asPesewas(input.fee ?? 0) &&
    old.direction === input.direction &&
    old.network === input.network;
  const balanceAfter = keepBalanceAfter ? old.balanceAfter : null;
  const usedAbsolute = old.balanceAfter != null || balanceAfter != null;

  if (!usedAbsolute) reverseWalletEffect(old);

  db.update(transactions)
    .set({
      amount: input.amount,
      fee: input.fee ?? 0,
      direction: input.direction,
      type: input.type,
      network: input.network,
      counterparty: input.counterparty,
      categoryId,
      note: input.note,
      occurredAt: input.occurredAt,
      paymentChannel: input.paymentChannel,
      employer: input.employer,
      accountId,
      balanceAfter,
    })
    .where(eq(transactions.id, id))
    .run();

  if (input.categoryId && input.counterparty?.trim()) {
    rememberRecipient(input.counterparty, input.categoryId);
  }

  const newWallet = walletId ?? accountId ?? null;
  if (usedAbsolute) {
    const syncWallet = (id: number) => {
      const implied = balanceImpliedByTransactions(id);
      if (implied != null) updateAccountBalance(id, implied);
    };
    const oldWallet = walletIdForRow(old);
    if (oldWallet != null) syncWallet(oldWallet);
    if (newWallet != null && newWallet !== oldWallet) syncWallet(newWallet);
  } else {
    applyWalletEffect(
      {
        direction: input.direction,
        amount: input.amount,
        fee: input.fee ?? 0,
        network: input.network ?? 'unknown',
        balanceAfter,
        accountId,
      },
      newWallet,
    );
  }
  return true;
}

function transactionsForAccount(accountId: number) {
  const account = listAccounts().find((a) => a.id === accountId);
  if (!account) return { account: null, sync: null as string | null, rows: [] as Transaction[] };
  const sync = account.syncNetwork && account.syncNetwork !== 'unknown' ? account.syncNetwork : null;
  const rows = db
    .select()
    .from(transactions)
    .where(
      sync
        ? or(eq(transactions.accountId, accountId), and(eq(transactions.network, sync), isNull(transactions.accountId)))
        : eq(transactions.accountId, accountId),
    )
    .orderBy(asc(transactions.occurredAt), asc(transactions.id))
    .all();
  return { account, sync, rows };
}

/**
 * Absolute balance implied by entries when there is an SMS “balance after” anchor.
 * MoMo and bank both keep an opening balance you set; plain +/- entries only move that figure.
 * Without an SMS balance line we cannot invent an absolute total from zero — return null.
 */
export function balanceImpliedByTransactions(accountId: number): number | null {
  const { sync, rows } = transactionsForAccount(accountId);
  let balance: number | null = null;
  for (const tx of rows) {
    if (tx.balanceAfter != null && (!sync || tx.network === sync)) {
      balance = asPesewas(tx.balanceAfter);
    } else if (balance != null) {
      balance += walletDelta(tx.direction, tx.amount, tx.fee ?? 0);
    }
  }
  return balance;
}

/** Net of +/- entries (ignores SMS absolute lines). Used when there is no balance-after anchor. */
export function netDeltaFromTransactions(accountId: number): number {
  const { sync, rows } = transactionsForAccount(accountId);
  let net = 0;
  for (const tx of rows) {
    if (tx.balanceAfter != null && (!sync || tx.network === sync)) continue;
    net += walletDelta(tx.direction, tx.amount, tx.fee ?? 0);
  }
  return net;
}

export interface BalanceCheckRow {
  accountId: number;
  name: string;
  stored: number;
  /** Absolute from SMS ledger when known; otherwise null (opening + entries model). */
  fromTransactions: number | null;
  netFromEntries: number;
  matches: boolean;
  /** True when an SMS balance line can set an absolute figure. */
  hasSmsAnchor: boolean;
}

/**
 * Compare wallets to their ledgers.
 * With an SMS balance line: stored should match the replayed absolute.
 * Without: MoMo/bank keep your opening balance; we only report net movement from entries (always “matches”).
 */
export function checkBalancesAgainstTransactions(): BalanceCheckRow[] {
  return listAccounts().map((a) => {
    const fromTransactions = balanceImpliedByTransactions(a.id);
    const netFromEntries = netDeltaFromTransactions(a.id);
    const stored = asPesewas(a.balance);
    const hasSmsAnchor = fromTransactions != null;
    return {
      accountId: a.id,
      name: a.name,
      stored,
      fromTransactions,
      netFromEntries,
      hasSmsAnchor,
      matches: hasSmsAnchor ? stored === fromTransactions : true,
    };
  });
}

/** Set wallets that have an SMS balance anchor to the figure their MoMo lines imply. */
export function reconcileBalancesFromTransactions(): number {
  let changed = 0;
  for (const row of checkBalancesAgainstTransactions()) {
    if (!row.hasSmsAnchor || row.matches || row.fromTransactions == null) continue;
    updateAccountBalance(row.accountId, row.fromTransactions);
    changed += 1;
  }
  return changed;
}

/**
 * Newest first. Use with useLiveQuery() for auto-refreshing lists.
 * When `smsSince` is set, imported SMS older than that instant are left out (free plan).
 */
export const recentTransactionsQuery = (limit = 200, smsSince?: string | null) => {
  const visible = smsSince
    ? or(eq(transactions.source, 'manual'), gte(transactions.occurredAt, smsSince))
    : undefined;
  const selected = db.select().from(transactions);
  return (visible ? selected.where(visible) : selected).orderBy(desc(transactions.occurredAt)).limit(limit);
};
