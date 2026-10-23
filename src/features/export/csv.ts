import type { Transaction } from '@/core/db/schema';
import { getDisplayCurrency, moneyCodeLabel, pesewasToInput } from '@/core/money/money';
import { APP_NAME, APP_OWNER } from '@/features/about/brand';

const TYPE_NAME: Record<Transaction['type'], string> = {
  expense: 'Expense',
  send: 'Sent',
  receive: 'Received',
  salary: 'Salary',
  cash_out: 'Cash out',
  cash_in: 'Cash in',
  airtime: 'Airtime / data',
  bill: 'Bill',
  other: 'Other',
};
const CHANNEL_NAME: Record<NonNullable<Transaction['paymentChannel']>, string> = {
  bank: 'Bank',
  momo: 'MoMo',
  cash: 'Cash',
  other: 'Other',
};
const NETWORK_NAME: Record<Transaction['network'], string> = {
  mtn: 'MTN',
  telecel: 'Telecel',
  airteltigo: 'AirtelTigo',
  unknown: '',
};
const SOURCE_NAME: Record<Transaction['source'], string> = {
  manual: 'Typed in',
  sms_paste: 'Pasted SMS',
  sms_auto: 'Auto-read SMS',
};

export function csvColumns(currencyCode = moneyCodeLabel()): string[] {
  return [
    'Date',
    'Time',
    'Type',
    'Direction',
    'Network',
    `Amount (${currencyCode})`,
    `Fee (${currencyCode})`,
    'Signed amount',
    'Person or business',
    'Employer',
    'Paid through',
    'Category',
    'Note',
    'Transaction ID',
    `Balance after (${currencyCode})`,
    'Source',
  ];
}

/** @deprecated Prefer csvColumns() — kept for older tests that import the constant. */
export const CSV_COLUMNS = csvColumns('GHS');

/**
 * Quotes a cell when needed (RFC 4180) and defuses spreadsheet formulas.
 * Names and notes come from SMS text, so one starting with "=" must not run in Excel.
 */
export function csvCell(value: string): string {
  // Plain signed numbers stay numeric in Excel; only formula-like cells get a leading quote.
  const looksNumeric = /^[+\-]?\d+(\.\d+)?$/.test(value);
  const safe = !looksNumeric && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(
  rows: Transaction[],
  categoryNames: Map<number, string>,
  opts?: { currencyCode?: string; periodLabel?: string },
): string {
  const code = opts?.currencyCode ?? moneyCodeLabel(getDisplayCurrency());
  const generated = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
  const period = opts?.periodLabel ?? 'All transactions';
  const meta = [
    [`${APP_NAME} export`],
    [`Generated`, generated],
    [`Period`, period],
    [`Currency`, code],
    [`Rows`, String(rows.length)],
    [`Publisher`, APP_OWNER],
    [],
  ];

  const lines: string[] = [];
  for (const row of meta) {
    lines.push(row.map(csvCell).join(','));
  }
  lines.push(csvColumns(code).map(csvCell).join(','));

  for (const tx of rows) {
    const signed =
      (tx.direction === 'in' ? '' : '-') + pesewasToInput(tx.amount);
    lines.push(
      [
        tx.occurredAt.slice(0, 10),
        tx.occurredAt.slice(11, 16),
        TYPE_NAME[tx.type],
        tx.direction === 'in' ? 'In' : 'Out',
        NETWORK_NAME[tx.network],
        pesewasToInput(tx.amount),
        pesewasToInput(tx.fee),
        signed,
        tx.counterparty ?? '',
        tx.employer ?? '',
        tx.paymentChannel ? CHANNEL_NAME[tx.paymentChannel] : '',
        tx.categoryId ? (categoryNames.get(tx.categoryId) ?? '') : '',
        tx.note ?? '',
        tx.externalRef ?? '',
        tx.balanceAfter === null ? '' : pesewasToInput(tx.balanceAfter),
        SOURCE_NAME[tx.source],
      ]
        .map(csvCell)
        .join(','),
    );
  }
  // BOM so Excel opens the file as UTF-8; CRLF line endings per the CSV standard.
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
