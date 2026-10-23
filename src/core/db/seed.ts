import { eq, sql } from 'drizzle-orm';

import type { TxType } from '../parser/types';
import { db } from './client';
import { categories } from './schema';

export const DEFAULT_CATEGORIES = [
  'Salary',
  'Food & groceries',
  'Transport',
  'Airtime & data',
  'Bills & utilities',
  'School & education',
  'Family support',
  'Business',
  'Health',
  'Shopping',
  'Church & giving',
  'Savings',
  'Cash withdrawal',
  'Other',
] as const;

/** Used when a transaction has no category and no remembered recipient. */
export const DEFAULT_CATEGORY_BY_TYPE: Partial<Record<TxType, (typeof DEFAULT_CATEGORIES)[number]>> = {
  expense: 'Food & groceries',
  airtime: 'Airtime & data',
  bill: 'Bills & utilities',
  cash_out: 'Cash withdrawal',
  salary: 'Salary',
};

/** Safe to call on every launch: only inserts when the table is empty. */
export function seedIfEmpty(): void {
  const row = db.select({ n: sql<number>`count(*)` }).from(categories).get();
  if (row && row.n > 0) {
    // Older installs: add Salary without wiping existing categories.
    const hasSalary = db.select().from(categories).where(eq(categories.name, 'Salary')).get();
    if (!hasSalary) {
      db.insert(categories).values({ name: 'Salary', isDefault: true }).run();
    }
    return;
  }
  db.insert(categories)
    .values(DEFAULT_CATEGORIES.map((name) => ({ name, isDefault: true })))
    .run();
}
