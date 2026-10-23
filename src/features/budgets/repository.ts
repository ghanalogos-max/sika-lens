import { and, eq } from 'drizzle-orm';

import { db } from '@/core/db/client';
import { budgets, categories } from '@/core/db/schema';
import { spendByCategory } from '@/features/insights/queries';

export interface BudgetRow {
  categoryId: number;
  name: string;
  limit: number | null;
  spent: number;
}

/** Every category with its limit (if set) and what has been spent this month. */
export function budgetRows(month: string, smsSince?: string | null): BudgetRow[] {
  const cats = db.select().from(categories).orderBy(categories.name).all();
  const limits = new Map(
    db.select().from(budgets).where(eq(budgets.month, month)).all().map((b) => [b.categoryId, b.limitAmount]),
  );
  const spent = new Map(spendByCategory(month, smsSince).map((s) => [s.categoryId, s.spent]));
  return cats.map((c) => ({
    categoryId: c.id,
    name: c.name,
    limit: limits.get(c.id) ?? null,
    spent: spent.get(c.id) ?? 0,
  }));
}

/** Pass null to remove the limit. */
export function setBudget(categoryId: number, month: string, limitAmount: number | null) {
  if (limitAmount === null) {
    db.delete(budgets).where(and(eq(budgets.categoryId, categoryId), eq(budgets.month, month))).run();
    return;
  }
  db.insert(budgets)
    .values({ categoryId, month, limitAmount })
    .onConflictDoUpdate({ target: [budgets.categoryId, budgets.month], set: { limitAmount } })
    .run();
}
