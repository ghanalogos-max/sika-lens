import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { NETWORKS, PAYMENT_CHANNELS, TX_TYPES } from '../parser/types';

export const ACCOUNT_KINDS = ['momo', 'bank', 'cash', 'other'] as const;

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});

/**
 * Wallets and bank balances the user tracks by hand (or synced from MoMo SMS balanceAfter).
 * Money stays on-device; this is not a live bank feed.
 */
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  kind: text('kind', { enum: ACCOUNT_KINDS }).notNull(),
  /** Matches src/ui/brands.ts ids (mtn, gcb, …). */
  brandId: text('brand_id').notNull(),
  /** Pesewas */
  balance: integer('balance').notNull().default(0),
  /**
   * When set, a saved MoMo SMS with balanceAfter for this network updates this wallet.
   * Only one account should claim each network.
   */
  syncNetwork: text('sync_network', { enum: NETWORKS }),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Pesewas, always positive. Direction says which way the money moved. */
    amount: integer('amount').notNull(),
    /** Pesewas: fees + levies + taxes the network charged on top. */
    fee: integer('fee').notNull().default(0),
    direction: text('direction', { enum: ['in', 'out'] }).notNull(),
    type: text('type', { enum: TX_TYPES }).notNull(),
    network: text('network', { enum: NETWORKS }).notNull().default('unknown'),
    counterparty: text('counterparty'),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    note: text('note'),
    /** ISO 8601 UTC string. Sorts correctly as text. */
    occurredAt: text('occurred_at').notNull(),
    source: text('source', { enum: ['manual', 'sms_paste', 'sms_auto'] })
      .notNull()
      .default('manual'),
    /** The network's transaction ID. NULL for manual entries. */
    externalRef: text('external_ref'),
    balanceAfter: integer('balance_after'),
    /** Original SMS text, kept so old messages can be re-parsed after parser fixes. */
    rawSms: text('raw_sms'),
    /** bank | momo | cash | other — mainly for salary / income. */
    paymentChannel: text('payment_channel', { enum: PAYMENT_CHANNELS }),
    /** Employer or income source, e.g. Ghana Education Service, Ghana Health Service, Self-employed. */
    employer: text('employer'),
    /** Wallet this entry credited or debited (null for older rows). */
    accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    // Same network + same transaction ID = same transaction. NULL refs never collide.
    uniqueIndex('transactions_network_ref_uq').on(t.network, t.externalRef),
    index('transactions_occurred_idx').on(t.occurredAt),
  ],
);

export const budgets = sqliteTable(
  'budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    /** 'YYYY-MM' */
    month: text('month').notNull(),
    /** Pesewas */
    limitAmount: integer('limit_amount').notNull(),
  },
  (t) => [uniqueIndex('budgets_category_month_uq').on(t.categoryId, t.month)],
);

/** "Last time you paid KOFI MENSAH you called it Food" -> remembered per counterparty. */
export const recipientRules = sqliteTable('recipient_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Lower-cased, trimmed counterparty. */
  counterparty: text('counterparty').notNull().unique(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
