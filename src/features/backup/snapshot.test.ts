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

import { addAccount, listAccounts } from '@/features/accounts/repository';
import { addTransaction } from '@/features/transactions/repository';
import { db } from '@/core/db/client';
import { transactions } from '@/core/db/schema';
import { applySnapshot, buildSnapshot } from './snapshot';

describe('ledger snapshot', () => {
  it('restores wallets and transactions and drops anything added later', () => {
    addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 5000, syncNetwork: 'mtn' });
    addTransaction({
      amount: 1500,
      fee: 20,
      direction: 'out',
      type: 'send',
      network: 'mtn',
      counterparty: 'Ama',
      occurredAt: '2026-10-01T10:00:00.000Z',
      source: 'manual',
    });
    const snap = buildSnapshot(new Date('2026-10-21T00:00:00.000Z'), 'Ama');
    expect(snap.profileName).toBe('Ama');

    addAccount({ name: 'Extra', kind: 'cash', brandId: 'cash', balance: 1, syncNetwork: null });
    addTransaction({
      amount: 999,
      fee: 0,
      direction: 'in',
      type: 'receive',
      network: 'unknown',
      occurredAt: '2026-10-02T10:00:00.000Z',
      source: 'manual',
    });

    applySnapshot(snap);

    expect(listAccounts().map((a) => a.name)).toEqual(['MTN']);
    // Snapshot keeps the wallet as it was after the send (5000 − 1500 − 20 fee).
    expect(listAccounts()[0].balance).toBe(3480);
    const rows = db.select().from(transactions).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].counterparty).toBe('Ama');
    expect(rows[0].amount).toBe(1500);
  });
});
