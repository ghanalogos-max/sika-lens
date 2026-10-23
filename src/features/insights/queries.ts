import { and, desc, eq, gte, lt, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { categories, transactions } from '@/core/db/schema';
import { daysInMonth, monthBounds } from '@/lib/dates';

/**
 * What counts as spending?
 *  - Every outgoing amount: sends, expenses, airtime, bills, cash-out, and other.
 *  - Cash-out is spent (money leaves the wallet to cash).
 *  - Income is money received from people, plus salary (not cash you deposited yourself).
 */
const isSpend = eq(transactions.direction, 'out');
const isIncome = sql`(${transactions.type} = 'receive' or ${transactions.type} = 'salary')`;

const inMonth = (month: string) => {
  const { start, end } = monthBounds(month);
  return and(gte(transactions.occurredAt, start), lt(transactions.occurredAt, end));
};

/**
 * Free plan hides imported SMS older than `smsSince`. Typed transactions always count.
 * Omit `smsSince` (or pass null) to include everything — Premium, and the tests.
 */
function smsVisible(smsSince?: string | null): SQL | undefined {
  if (!smsSince) return undefined;
  return or(eq(transactions.source, 'manual'), gte(transactions.occurredAt, smsSince));
}

function whereAll(...parts: (SQL | undefined)[]) {
  const present = parts.filter((p): p is SQL => p != null);
  return present.length ? and(...present) : undefined;
}

export interface MonthSummary {
  spent: number;
  /** Money sent to a person (type send). */
  sent: number;
  /**
   * All outgoing spending this month (same as spent): sends, expenses,
   * airtime, bills, cash-out, and other.
   */
  expenses: number;
  received: number;
  fees: number;
}

function asPesewas(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function monthSummary(month: string, smsSince?: string | null): MonthSummary {
  const row = db
    .select({
      spent: sql<number>`coalesce(sum(case when ${isSpend} then ${transactions.amount} else 0 end), 0)`,
      sent: sql<number>`coalesce(sum(case when ${transactions.type} = 'send' then ${transactions.amount} else 0 end), 0)`,
      received: sql<number>`coalesce(sum(case when ${isIncome} then ${transactions.amount} else 0 end), 0)`,
      fees: sql<number>`coalesce(sum(${transactions.fee}), 0)`,
    })
    .from(transactions)
    .where(whereAll(inMonth(month), smsVisible(smsSince)))
    .get();
  const spent = asPesewas(row?.spent);
  const sent = asPesewas(row?.sent);
  return {
    spent,
    sent,
    expenses: spent,
    received: asPesewas(row?.received),
    fees: asPesewas(row?.fees),
  };
}

/** Network fees from January through December of `year`. */
export function feesInYear(year: number, smsSince?: string | null): number {
  const start = new Date(Date.UTC(year, 0, 1)).toISOString();
  const end = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
  const row = db
    .select({ fees: sql<number>`coalesce(sum(${transactions.fee}), 0)` })
    .from(transactions)
    .where(whereAll(gte(transactions.occurredAt, start), lt(transactions.occurredAt, end), smsVisible(smsSince)))
    .get();
  return asPesewas(row?.fees);
}

/** Pesewas spent on each calendar day of `month`, index 0 = the 1st. Missing days are 0. */
export function spendByDay(month: string, smsSince?: string | null): number[] {
  const days = daysInMonth(month);
  const daily = Array.from({ length: days }, () => 0);
  const rows = db
    .select({
      day: sql<string>`substr(${transactions.occurredAt}, 9, 2)`,
      spent: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .where(whereAll(inMonth(month), isSpend, smsVisible(smsSince)))
    .groupBy(sql`substr(${transactions.occurredAt}, 9, 2)`)
    .all();
  for (const row of rows) {
    const index = Number(row.day) - 1;
    if (index >= 0 && index < days) daily[index] = asPesewas(row.spent);
  }
  return daily;
}

export interface CategorySpend {
  categoryId: number | null;
  name: string;
  spent: number;
}

export function spendByCategory(month: string, smsSince?: string | null): CategorySpend[] {
  const rows = db
    .select({
      categoryId: transactions.categoryId,
      name: sql<string | null>`${categories.name}`,
      spent: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(whereAll(inMonth(month), isSpend, smsVisible(smsSince)))
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`sum(${transactions.amount})`))
    .all();
  return rows.map((r) => ({
    categoryId: r.categoryId,
    name: r.name ?? 'Uncategorised',
    spent: asPesewas(r.spent),
  }));
}

export interface RecipientSpend {
  counterparty: string;
  spent: number;
  count: number;
}

export function topRecipients(month: string, limit = 5, smsSince?: string | null): RecipientSpend[] {
  return db
    .select({
      counterparty: sql<string>`${transactions.counterparty}`,
      spent: sql<number>`sum(${transactions.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(whereAll(inMonth(month), isSpend, sql`${transactions.counterparty} is not null`, smsVisible(smsSince)))
    .groupBy(transactions.counterparty)
    .orderBy(desc(sql`sum(${transactions.amount})`))
    .limit(limit)
    .all()
    .map((r) => ({
      counterparty: r.counterparty,
      spent: asPesewas(r.spent),
      count: asPesewas(r.count),
    }));
}
