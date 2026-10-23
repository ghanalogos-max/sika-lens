/**
 * Runs the real repository + insights SQL against an in-memory SQLite (better-sqlite3)
 * using the generated migration files. The Expo database client is swapped out because
 * expo-sqlite only exists on a phone.
 */
jest.mock('@/core/db/client', () => {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  const schema = require('@/core/db/schema');

  const sqlite = new Database(':memory:');
  const dir = path.join(process.cwd(), 'drizzle');
  for (const file of fs.readdirSync(dir).filter((f: string) => f.endsWith('.sql')).sort()) {
    sqlite.exec(fs.readFileSync(path.join(dir, file), 'utf8').replace(/--> statement-breakpoint/g, ''));
  }
  return { db: drizzle(sqlite, { schema }) };
});

import { db } from '@/core/db/client';
import { seedIfEmpty } from '@/core/db/seed';
import { categories, transactions } from '@/core/db/schema';
import { budgetRows, setBudget } from '@/features/budgets/repository';
import { monthSummary, spendByCategory, topRecipients } from '@/features/insights/queries';
import { addTransaction, listCategories, suggestCategoryId } from '@/features/transactions/repository';
import { eq } from 'drizzle-orm';

const MONTH = '2026-10';
const catId = (name: string) => db.select().from(categories).where(eq(categories.name, name)).get()!.id;

beforeAll(() => seedIfEmpty());

describe('seeding', () => {
  it('creates the default categories once', () => {
    const before = listCategories().length;
    seedIfEmpty();
    expect(listCategories().length).toBe(before);
    expect(before).toBeGreaterThan(5);
  });
});

describe('addTransaction', () => {
  it('rejects the same network + transaction ID twice', () => {
    const base = {
      amount: 2500, direction: 'out', type: 'send', network: 'mtn', externalRef: 'REF-DUP-1',
      occurredAt: '2026-09-05T10:00:00.000Z', source: 'sms_paste',
    } as const;
    expect(addTransaction(base).inserted).toBe(true);
    expect(addTransaction(base).inserted).toBe(false);
  });

  it('allows the same ID on a different network, and manual entries with no ID', () => {
    const t = { amount: 100, direction: 'out', type: 'send', occurredAt: '2026-09-06T10:00:00.000Z' } as const;
    expect(addTransaction({ ...t, network: 'mtn', externalRef: 'REF-X' }).inserted).toBe(true);
    expect(addTransaction({ ...t, network: 'telecel', externalRef: 'REF-X' }).inserted).toBe(true);
    expect(addTransaction({ ...t, network: 'unknown', source: 'manual' }).inserted).toBe(true);
    expect(addTransaction({ ...t, network: 'unknown', source: 'manual' }).inserted).toBe(true);
  });

  it('files airtime under its default category', () => {
    // (Looked up by type: better-sqlite3 names the insert-id field differently from expo-sqlite.)
    addTransaction({
      amount: 1000, direction: 'out', type: 'airtime', network: 'mtn', occurredAt: '2026-09-07T10:00:00.000Z',
    });
    const row = db.select().from(transactions).where(eq(transactions.type, 'airtime')).get();
    expect(row?.categoryId).toBe(catId('Airtime & data'));
  });

  it('remembers the category you chose for a recipient and suggests it next time', () => {
    addTransaction({
      amount: 500, direction: 'out', type: 'send', network: 'mtn', counterparty: 'Kofi Mensah',
      categoryId: catId('Transport'), occurredAt: '2026-09-08T10:00:00.000Z',
    });
    expect(suggestCategoryId('  KOFI mensah ')).toBe(catId('Transport'));
    expect(suggestCategoryId('Someone else')).toBeNull();
  });
});

describe('monthly insights (October 2026)', () => {
  beforeAll(() => {
    const o = (over: object) =>
      addTransaction({
        amount: 0, direction: 'out', type: 'send', network: 'mtn', occurredAt: '2026-10-10T12:00:00.000Z', ...over,
      });
    o({ amount: 5000, fee: 50, counterparty: 'AMA', categoryId: catId('Food & groceries') });
    o({ amount: 3000, fee: 30, counterparty: 'AMA', categoryId: catId('Food & groceries') });
    o({ amount: 2000, fee: 20, counterparty: 'KWAME', categoryId: catId('Transport') });
    o({ amount: 10000, fee: 100, type: 'cash_out', counterparty: 'AGENT' }); // cash-out counts as spent
    o({ amount: 40000, direction: 'in', type: 'receive', counterparty: 'BOSS' });
    o({ amount: 9999, occurredAt: '2026-11-01T00:00:00.000Z' }); // next month: ignored
    o({ amount: 8888, occurredAt: '2026-09-30T23:59:59.000Z' }); // previous month: ignored
  });

  it('sums spent (including cash-out), received and fees', () => {
    expect(monthSummary(MONTH)).toEqual({ spent: 20000, sent: 10000, expenses: 20000, received: 40000, fees: 200 });
  });

  it('groups spending by category, biggest first', () => {
    expect(spendByCategory(MONTH)).toEqual([
      { categoryId: catId('Cash withdrawal'), name: 'Cash withdrawal', spent: 10000 },
      { categoryId: catId('Food & groceries'), name: 'Food & groceries', spent: 8000 },
      { categoryId: catId('Transport'), name: 'Transport', spent: 2000 },
    ]);
  });

  it('ranks the biggest recipients including cash-out agents', () => {
    expect(topRecipients(MONTH)).toEqual([
      { counterparty: 'AGENT', spent: 10000, count: 1 },
      { counterparty: 'AMA', spent: 8000, count: 2 },
      { counterparty: 'KWAME', spent: 2000, count: 1 },
    ]);
  });

  it('computes budget progress and supports clearing a limit', () => {
    const food = catId('Food & groceries');
    setBudget(food, MONTH, 7000);
    let row = budgetRows(MONTH).find((r) => r.categoryId === food)!;
    expect(row).toMatchObject({ limit: 7000, spent: 8000 }); // over budget

    setBudget(food, MONTH, 9000); // update, not duplicate
    row = budgetRows(MONTH).find((r) => r.categoryId === food)!;
    expect(row.limit).toBe(9000);

    setBudget(food, MONTH, null);
    row = budgetRows(MONTH).find((r) => r.categoryId === food)!;
    expect(row.limit).toBeNull();
  });

  it('counts a categorised expense apart from money sent', () => {
    addTransaction({
      amount: 2500,
      direction: 'out',
      type: 'expense',
      network: 'unknown',
      categoryId: catId('Shopping'),
      counterparty: 'Shoprite',
      occurredAt: '2026-12-02T12:00:00.000Z',
    });
    expect(monthSummary('2026-12')).toMatchObject({ expenses: 2500, sent: 0, spent: 2500, received: 0 });
    expect(spendByCategory('2026-12')).toEqual([
      { categoryId: catId('Shopping'), name: 'Shopping', spent: 2500 },
    ]);
  });
});
