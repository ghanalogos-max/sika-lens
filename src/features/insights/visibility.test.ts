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

import { monthSummary, spendByDay } from '@/features/insights/queries';
import { addTransaction } from '@/features/transactions/repository';

const CUTOFF = '2026-09-21T00:00:00.000Z';

describe('free SMS history', () => {
  it('hides imported messages older than the cutoff and keeps typed ones', () => {
    addTransaction({
      amount: 4000,
      fee: 100,
      direction: 'out',
      type: 'send',
      network: 'mtn',
      occurredAt: '2026-10-01T08:00:00.000Z',
      source: 'sms_paste',
    });
    addTransaction({
      amount: 9000,
      fee: 50,
      direction: 'out',
      type: 'send',
      network: 'mtn',
      externalRef: 'OLD-SMS',
      occurredAt: '2026-08-01T08:00:00.000Z',
      source: 'sms_paste',
    });
    addTransaction({
      amount: 3000,
      fee: 0,
      direction: 'out',
      type: 'send',
      network: 'unknown',
      occurredAt: '2026-08-02T08:00:00.000Z',
      source: 'manual',
    });

    expect(monthSummary('2026-10', CUTOFF).spent).toBe(4000);
    expect(monthSummary('2026-08', CUTOFF).spent).toBe(3000);
    expect(monthSummary('2026-08', CUTOFF).fees).toBe(0);
    expect(monthSummary('2026-08').spent).toBe(12000);
    expect(spendByDay('2026-10', CUTOFF)[0]).toBe(4000);
    expect(spendByDay('2026-08', CUTOFF)[1]).toBe(3000);
    expect(spendByDay('2026-08')[0]).toBe(9000);
    expect(spendByDay('2026-10')).toHaveLength(31);
  });
});