import { desc, eq } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { transactions } from '@/core/db/schema';

/**
 * Find the most recent outgoing charge that looks like this subscription
 * (name appears in counterparty, note, or employer). Used for “fill from ledger”.
 */
export function suggestAmountFromLedger(subscriptionName: string): number | null {
  const needle = subscriptionName.trim().toLowerCase();
  if (needle.length < 2) return null;

  const rows = db
    .select({
      amount: transactions.amount,
      counterparty: transactions.counterparty,
      note: transactions.note,
      employer: transactions.employer,
    })
    .from(transactions)
    .where(eq(transactions.direction, 'out'))
    .orderBy(desc(transactions.occurredAt))
    .limit(200)
    .all();

  for (const row of rows) {
    const hay = [row.counterparty, row.note, row.employer]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay) continue;
    if (hay.includes(needle) || needle.split(/\s+/).some((w) => w.length > 3 && hay.includes(w))) {
      return row.amount;
    }
  }
  return null;
}
