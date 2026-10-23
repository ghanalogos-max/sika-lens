import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { accounts, type NewAccount } from '@/core/db/schema';
import type { Network } from '@/core/parser/types';
import { brandById } from '@/ui/brands';

/** SQLite / drizzle sometimes return integers as strings — keep money math numeric. */
function asPesewas(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function listAccounts() {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.archived, false))
    .orderBy(asc(accounts.sortOrder), asc(accounts.id))
    .all()
    .map((a) => ({ ...a, balance: asPesewas(a.balance) }));
}

export function totalBalances(): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${accounts.balance}), 0)` })
    .from(accounts)
    .where(eq(accounts.archived, false))
    .get();
  return asPesewas(row?.total);
}

export function findAccountBySyncNetwork(network: Network) {
  if (network === 'unknown') return null;
  const row = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.syncNetwork, network), eq(accounts.archived, false)))
    .get();
  return row ? { ...row, balance: asPesewas(row.balance) } : null;
}

/** Best MoMo wallet for an SMS network: sync target first, then a matching brand, then any MoMo. */
export function preferMomoAccount(network: Network) {
  const sync = findAccountBySyncNetwork(network);
  if (sync) return sync;
  const all = listAccounts().filter((a) => a.kind === 'momo');
  if (network !== 'unknown') {
    const byBrand = all.find((a) => a.brandId === network || a.syncNetwork === network);
    if (byBrand) return byBrand;
  }
  return all[0] ?? null;
}

export function addAccount(input: Omit<NewAccount, 'id' | 'updatedAt' | 'archived' | 'sortOrder'> & { sortOrder?: number }) {
  const brand = brandById(input.brandId);
  const syncNetwork = input.syncNetwork ?? brand.network ?? null;
  // Only one wallet may sync a given network.
  if (syncNetwork && syncNetwork !== 'unknown') {
    db.update(accounts)
      .set({ syncNetwork: null, updatedAt: new Date().toISOString() })
      .where(eq(accounts.syncNetwork, syncNetwork))
      .run();
  }
  const maxSort = db.select({ n: sql<number>`coalesce(max(${accounts.sortOrder}), -1)` }).from(accounts).get()?.n ?? -1;
  db.insert(accounts)
    .values({
      ...input,
      syncNetwork: syncNetwork === 'unknown' ? null : syncNetwork,
      sortOrder: input.sortOrder ?? maxSort + 1,
      archived: false,
      updatedAt: new Date().toISOString(),
    })
    .run();
  // expo-sqlite and better-sqlite3 expose the insert id under different names.
  const row = db.select({ id: accounts.id }).from(accounts).orderBy(sql`${accounts.id} desc`).limit(1).get();
  return row!.id;
}

export function updateAccountBalance(id: number, balance: number) {
  db.update(accounts)
    .set({ balance: asPesewas(balance), updatedAt: new Date().toISOString() })
    .where(eq(accounts.id, id))
    .run();
}

/** Credit (or debit with a negative delta) a tracked wallet. Coerces string balances. */
export function addAccountBalance(id: number, deltaPesewas: number) {
  const row = db.select({ balance: accounts.balance }).from(accounts).where(eq(accounts.id, id)).get();
  if (!row) return;
  const next = asPesewas(row.balance) + asPesewas(deltaPesewas);
  db.update(accounts)
    .set({ balance: next, updatedAt: new Date().toISOString() })
    .where(eq(accounts.id, id))
    .run();
}

export function updateAccount(
  id: number,
  patch: {
    name?: string;
    kind?: NewAccount['kind'];
    brandId?: string;
    balance?: number;
    syncNetwork?: Network | null;
  },
) {
  if (patch.syncNetwork && patch.syncNetwork !== 'unknown') {
    db.update(accounts)
      .set({ syncNetwork: null, updatedAt: new Date().toISOString() })
      .where(and(eq(accounts.syncNetwork, patch.syncNetwork), sql`${accounts.id} != ${id}`))
      .run();
  }
  db.update(accounts)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(accounts.id, id))
    .run();
}

export function archiveAccount(id: number) {
  db.update(accounts)
    .set({ archived: true, syncNetwork: null, updatedAt: new Date().toISOString() })
    .where(eq(accounts.id, id))
    .run();
}

/** After a MoMo SMS save, push balanceAfter onto the wallet that syncs that network. */
export function applySmsBalance(network: Network, balanceAfter: number | null | undefined) {
  if (balanceAfter == null || network === 'unknown') return;
  db.update(accounts)
    .set({ balance: balanceAfter, updatedAt: new Date().toISOString() })
    .where(and(eq(accounts.syncNetwork, network), eq(accounts.archived, false)))
    .run();
}
