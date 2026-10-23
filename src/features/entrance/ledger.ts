import { sql } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { accounts, transactions } from '@/core/db/schema';

/** True when this phone already has a wallet or a transaction. Categories alone do not count. */
export function ledgerHasRecords(): boolean {
  const tx = db.select({ n: sql<number>`count(*)` }).from(transactions).get();
  const wallets = db.select({ n: sql<number>`count(*)` }).from(accounts).get();
  return (tx?.n ?? 0) > 0 || (wallets?.n ?? 0) > 0;
}
