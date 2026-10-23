import { eq } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { accounts, budgets, categories, recipientRules, transactions } from '@/core/db/schema';
import { seedIfEmpty } from '@/core/db/seed';

/** Everything the ledger needs, and nothing from the PIN store. */
export type LedgerSnapshot = {
  version: 1;
  exportedAt: string;
  categories: { id: number; name: string; isDefault: boolean }[];
  accounts: {
    name: string;
    kind: (typeof accounts.$inferSelect)['kind'];
    brandId: string;
    balance: number;
    syncNetwork: (typeof accounts.$inferSelect)['syncNetwork'];
    sortOrder: number;
    archived: boolean;
    updatedAt: string;
  }[];
  /** accountId is device-local; backups omit it and restore with null. */
  transactions: Omit<(typeof transactions.$inferSelect), 'id' | 'accountId'>[];
  budgets: { categoryId: number; month: string; limitAmount: number }[];
  recipientRules: { counterparty: string; categoryId: number }[];
  /** Display name. Missing on backups made before names existed. */
  profileName?: string | null;
};

export function buildSnapshot(now: Date = new Date(), profileName: string | null = null): LedgerSnapshot {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    profileName,
    categories: db
      .select({ id: categories.id, name: categories.name, isDefault: categories.isDefault })
      .from(categories)
      .all(),
    accounts: db
      .select({
        name: accounts.name,
        kind: accounts.kind,
        brandId: accounts.brandId,
        balance: accounts.balance,
        syncNetwork: accounts.syncNetwork,
        sortOrder: accounts.sortOrder,
        archived: accounts.archived,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .all(),
    transactions: db
      .select({
        amount: transactions.amount,
        fee: transactions.fee,
        direction: transactions.direction,
        type: transactions.type,
        network: transactions.network,
        counterparty: transactions.counterparty,
        categoryId: transactions.categoryId,
        note: transactions.note,
        occurredAt: transactions.occurredAt,
        source: transactions.source,
        externalRef: transactions.externalRef,
        balanceAfter: transactions.balanceAfter,
        rawSms: transactions.rawSms,
        paymentChannel: transactions.paymentChannel,
        employer: transactions.employer,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .all(),
    budgets: db
      .select({ categoryId: budgets.categoryId, month: budgets.month, limitAmount: budgets.limitAmount })
      .from(budgets)
      .all(),
    recipientRules: db
      .select({ counterparty: recipientRules.counterparty, categoryId: recipientRules.categoryId })
      .from(recipientRules)
      .all(),
  };
}

/** Deletes every transaction, account, budget and rule, then restores the default categories. */
export function eraseLedger(): void {
  db.transaction((tx) => {
    tx.delete(transactions).run();
    tx.delete(budgets).run();
    tx.delete(recipientRules).run();
    tx.delete(accounts).run();
    tx.delete(categories).run();
  });
  seedIfEmpty();
}

/** Replaces the ledger on this phone. The PIN is left alone. */
export function applySnapshot(snap: LedgerSnapshot): void {
  if (snap.version !== 1) throw new Error('not-backup');
  db.transaction((tx) => {
    tx.delete(transactions).run();
    tx.delete(budgets).run();
    tx.delete(recipientRules).run();
    tx.delete(accounts).run();
    tx.delete(categories).run();

    const categoryIds = new Map<number, number>();
    for (const c of snap.categories) {
      tx.insert(categories).values({ name: c.name, isDefault: c.isDefault }).run();
      const row = tx.select({ id: categories.id }).from(categories).where(eq(categories.name, c.name)).get();
      if (!row) throw new Error('not-backup');
      categoryIds.set(c.id, row.id);
    }
    const mapCategory = (id: number | null) => (id == null ? null : (categoryIds.get(id) ?? null));

    for (const a of snap.accounts) {
      tx.insert(accounts).values(a).run();
    }
    for (const t of snap.transactions) {
      tx.insert(transactions).values({ ...t, categoryId: mapCategory(t.categoryId) }).run();
    }
    for (const b of snap.budgets) {
      const categoryId = categoryIds.get(b.categoryId);
      if (categoryId == null) continue;
      tx.insert(budgets).values({ categoryId, month: b.month, limitAmount: b.limitAmount }).run();
    }
    for (const r of snap.recipientRules) {
      const categoryId = categoryIds.get(r.categoryId);
      if (categoryId == null) continue;
      tx.insert(recipientRules).values({ counterparty: r.counterparty, categoryId }).run();
    }
  });
}
