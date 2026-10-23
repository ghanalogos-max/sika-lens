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

import {
  addCategory,
  addTransaction,
  checkBalancesAgainstTransactions,
  deleteTransaction,
  reconcileBalancesFromTransactions,
  updateTransaction,
  walletDelta,
} from '@/features/transactions/repository';
import {
  addAccount,
  applySmsBalance,
  listAccounts,
  totalBalances,
  updateAccountBalance,
} from './repository';

describe('accounts', () => {
  it('stores wallets and totals balances', () => {
    addAccount({ name: 'My MTN', kind: 'momo', brandId: 'mtn', balance: 12050, syncNetwork: 'mtn' });
    addAccount({ name: 'GCB', kind: 'bank', brandId: 'gcb', balance: 50000, syncNetwork: null });
    expect(listAccounts()).toHaveLength(2);
    expect(totalBalances()).toBe(62050);
  });

  it('updates MoMo balance from SMS and keeps one sync target per network', () => {
    const id1 = addAccount({ name: 'MTN A', kind: 'momo', brandId: 'mtn', balance: 100, syncNetwork: 'mtn' });
    addAccount({ name: 'MTN B', kind: 'momo', brandId: 'mtn', balance: 200, syncNetwork: 'mtn' });
    const rows = listAccounts();
    const synced = rows.filter((a) => a.syncNetwork === 'mtn');
    expect(synced).toHaveLength(1);
    expect(synced[0].id).not.toBe(id1);

    applySmsBalance('mtn', 9999);
    expect(listAccounts().find((a) => a.syncNetwork === 'mtn')?.balance).toBe(9999);
  });

  it('applies balanceAfter when a MoMo transaction is saved', () => {
    addAccount({ name: 'Telecel', kind: 'momo', brandId: 'telecel', balance: 0, syncNetwork: 'telecel' });
    addTransaction({
      amount: 5000,
      direction: 'out',
      type: 'send',
      network: 'telecel',
      balanceAfter: 8000,
      occurredAt: '2026-10-21T10:00:00.000Z',
      externalRef: 'TEL-BAL-1',
      source: 'sms_paste',
    });
    expect(listAccounts().find((a) => a.brandId === 'telecel')?.balance).toBe(8000);
  });

  it('debits the synced MoMo wallet when a send has no balanceAfter', () => {
    addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 10000, syncNetwork: 'mtn' });
    addTransaction({
      amount: 2500,
      fee: 50,
      direction: 'out',
      type: 'send',
      network: 'mtn',
      occurredAt: '2026-10-22T10:00:00.000Z',
      externalRef: 'MTN-SEND-1',
      source: 'sms_paste',
    });
    expect(listAccounts().find((a) => a.syncNetwork === 'mtn')?.balance).toBe(7450);
  });

  it('debits a chosen wallet for a manual expense', () => {
    const id = addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 20000, syncNetwork: 'mtn' });
    addTransaction(
      {
        amount: 3000,
        fee: 0,
        direction: 'out',
        type: 'expense',
        network: 'mtn',
        occurredAt: '2026-10-22T11:00:00.000Z',
        source: 'manual',
      },
      { accountId: id },
    );
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(17000);
  });

  it('debits amount plus fee for cash-out and credits receive', () => {
    const id = addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 50000, syncNetwork: null });
    addTransaction(
      {
        amount: 20000,
        fee: 200,
        direction: 'out',
        type: 'cash_out',
        network: 'mtn',
        occurredAt: '2026-10-22T12:00:00.000Z',
        source: 'manual',
      },
      { accountId: id },
    );
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(29800);

    addTransaction(
      {
        amount: 5000,
        fee: 0,
        direction: 'in',
        type: 'receive',
        network: 'mtn',
        occurredAt: '2026-10-22T13:00:00.000Z',
        source: 'manual',
      },
      { accountId: id },
    );
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(34800);
  });

  it('credits receive net of fee and reverses wallet on delete', () => {
    expect(walletDelta('in', 10000, 100)).toBe(9900);
    expect(walletDelta('out', 10000, 100)).toBe(-10100);

    const id = addAccount({ name: 'Cash', kind: 'cash', brandId: 'cash', balance: 20000, syncNetwork: null });
    const { id: txId } = addTransaction(
      {
        amount: 10000,
        fee: 100,
        direction: 'in',
        type: 'receive',
        network: 'unknown',
        occurredAt: '2026-10-22T14:00:00.000Z',
        source: 'manual',
      },
      { accountId: id },
    );
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(29900);
    expect(txId).not.toBeNull();
    deleteTransaction(txId!);
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(20000);
  });

  it('does not reverse wallet when SMS set an absolute balanceAfter', () => {
    addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 1000, syncNetwork: 'mtn' });
    const { id: txId } = addTransaction({
      amount: 5000,
      fee: 50,
      direction: 'out',
      type: 'send',
      network: 'mtn',
      balanceAfter: 8000,
      occurredAt: '2026-10-22T15:00:00.000Z',
      externalRef: 'MTN-ABS-1',
      source: 'sms_paste',
    });
    expect(listAccounts().find((a) => a.syncNetwork === 'mtn')?.balance).toBe(8000);
    deleteTransaction(txId!);
    expect(listAccounts().find((a) => a.syncNetwork === 'mtn')?.balance).toBe(8000);
  });

  it('adds a custom category without duplicating by case', () => {
    const a = addCategory('  Church Offering ');
    const b = addCategory('church offering');
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.id).toBe(a.id);
  });

  it('edits a transaction and adjusts the wallet by the difference', () => {
    const id = addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 10000, syncNetwork: null });
    const { id: txId } = addTransaction(
      {
        amount: 2000,
        fee: 0,
        direction: 'out',
        type: 'expense',
        network: 'mtn',
        occurredAt: '2026-10-22T16:00:00.000Z',
        source: 'manual',
      },
      { accountId: id },
    );
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(8000);
    updateTransaction(txId!, {
      amount: 3000,
      fee: 100,
      direction: 'out',
      type: 'expense',
      network: 'mtn',
      counterparty: null,
      categoryId: null,
      note: null,
      occurredAt: '2026-10-22T16:00:00.000Z',
      paymentChannel: 'momo',
      employer: null,
      accountId: id,
    });
    // 10000 − (3000 + 100) = 6900
    expect(listAccounts().find((a) => a.id === id)?.balance).toBe(6900);
  });

  it('keeps opening balances for bank/MoMo without SMS anchors; fixes MoMo SMS drift', () => {
    const bankId = addAccount({ name: 'GCB', kind: 'bank', brandId: 'gcb', balance: 20000, syncNetwork: null });
    addTransaction(
      {
        amount: 5000,
        fee: 0,
        direction: 'out',
        type: 'expense',
        network: 'unknown',
        occurredAt: '2026-10-22T17:00:00.000Z',
        source: 'manual',
      },
      { accountId: bankId },
    );
    // Opening 200 − 50 = 150; not restarted from zero
    expect(listAccounts().find((a) => a.id === bankId)?.balance).toBe(15000);
    const bankCheck = checkBalancesAgainstTransactions().find((c) => c.accountId === bankId)!;
    expect(bankCheck.hasSmsAnchor).toBe(false);
    expect(bankCheck.matches).toBe(true);
    expect(bankCheck.fromTransactions).toBeNull();
    expect(bankCheck.netFromEntries).toBe(-5000);

    addAccount({ name: 'MTN', kind: 'momo', brandId: 'mtn', balance: 1000, syncNetwork: 'mtn' });
    addTransaction({
      amount: 5000,
      fee: 50,
      direction: 'out',
      type: 'send',
      network: 'mtn',
      balanceAfter: 8000,
      occurredAt: '2026-10-22T18:00:00.000Z',
      externalRef: 'MTN-RECON-1',
      source: 'sms_paste',
    });
    expect(listAccounts().find((a) => a.syncNetwork === 'mtn')?.balance).toBe(8000);
    const mtnId = listAccounts().find((a) => a.syncNetwork === 'mtn')!.id;
    updateAccountBalance(mtnId, 1000);
    const mtnCheck = checkBalancesAgainstTransactions().find((c) => c.accountId === mtnId)!;
    expect(mtnCheck.hasSmsAnchor).toBe(true);
    expect(mtnCheck.matches).toBe(false);
    expect(mtnCheck.fromTransactions).toBe(8000);
    expect(reconcileBalancesFromTransactions()).toBeGreaterThanOrEqual(1);
    expect(listAccounts().find((a) => a.id === mtnId)?.balance).toBe(8000);
    expect(totalBalances()).toBe(listAccounts().reduce((s, a) => s + a.balance, 0));
  });
});
