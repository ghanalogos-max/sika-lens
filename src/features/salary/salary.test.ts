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

import { seedIfEmpty } from '@/core/db/seed';
import { addAccount, listAccounts } from '@/features/accounts/repository';
import { monthSummary } from '@/features/insights/queries';
import { addTransaction, ensureSalaryCategoryId } from '@/features/transactions/repository';
import { addAccountBalance } from '@/features/accounts/repository';

beforeAll(() => seedIfEmpty());

describe('salary', () => {
  it('creates a Salary category and counts salary as income', () => {
    const categoryId = ensureSalaryCategoryId();
    expect(categoryId).toBeGreaterThan(0);
    addTransaction({
      amount: 350000,
      fee: 0,
      direction: 'in',
      type: 'salary',
      network: 'unknown',
      counterparty: 'GES',
      employer: 'GES',
      paymentChannel: 'bank',
      categoryId,
      occurredAt: '2026-10-25T09:00:00.000Z',
      source: 'manual',
    });
    expect(monthSummary('2026-10').received).toBe(350000);
  });

  it('can credit a linked bank wallet', () => {
    const id = addAccount({ name: 'GCB pay', kind: 'bank', brandId: 'gcb', balance: 10000, syncNetwork: null });
    addAccountBalance(id, 50000);
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(60000);
  });
});
