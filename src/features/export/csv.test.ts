import type { Transaction } from '@/core/db/schema';
import { setDisplayCurrency } from '@/core/money/money';

import { CSV_COLUMNS, csvCell, csvColumns, toCsv } from './csv';

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  amount: 2500,
  fee: 50,
  direction: 'out',
  type: 'send',
  network: 'mtn',
  counterparty: 'KOFI MENSAH',
  categoryId: 3,
  note: null,
  occurredAt: '2026-10-20T14:32:00.000Z',
  source: 'sms_paste',
  externalRef: '31245678901',
  balanceAfter: 12050,
  rawSms: 'secret raw text',
  paymentChannel: null,
  employer: null,
  accountId: null,
  createdAt: '2026-10-20T14:33:00.000Z',
  ...over,
});

beforeEach(() => setDisplayCurrency('GHS'));

describe('csvCell', () => {
  it('leaves plain text alone and quotes commas, quotes and newlines', () => {
    expect(csvCell('Kofi')).toBe('Kofi');
    expect(csvCell('Asare, Sons')).toBe('"Asare, Sons"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });
  it('defuses spreadsheet formulas but keeps plain signed amounts', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell('+233200000000')).toBe('+233200000000');
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('-25.00')).toBe('-25.00');
    expect(csvCell('-5+cmd')).toBe("'-5+cmd");
  });
});

describe('toCsv', () => {
  it('writes a BOM, metadata, a header, and CRLF line endings', () => {
    const csv = toCsv([tx()], new Map([[3, 'Transport']]), { currencyCode: 'GHS', periodLabel: 'October 2026' });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('SikaLens export');
    expect(csv).toContain('Celestial Web Solutions');
    expect(csv).toContain(csvColumns('GHS').join(','));
    expect(csv.includes('\r\n')).toBe(true);
  });

  it('formats a row with amounts and a signed column for Excel', () => {
    const lines = toCsv([tx()], new Map([[3, 'Transport']]), { currencyCode: 'GHS' }).split('\r\n');
    const headerIndex = lines.findIndex((l) => l.startsWith('Date,'));
    const row = lines[headerIndex + 1];
    expect(row).toBe(
      '2026-10-20,14:32,Sent,Out,MTN,25.00,0.50,-25.00,KOFI MENSAH,,,Transport,,31245678901,120.50,Pasted SMS',
    );
  });

  it('exports salary employer and payment channel', () => {
    const lines = toCsv(
      [tx({ type: 'salary', direction: 'in', employer: 'GES', paymentChannel: 'bank', counterparty: 'GES', fee: 0 })],
      new Map([[3, 'Salary']]),
      { currencyCode: 'GHS' },
    ).split('\r\n');
    const headerIndex = lines.findIndex((l) => l.startsWith('Date,'));
    expect(lines[headerIndex + 1]).toBe(
      '2026-10-20,14:32,Salary,In,MTN,25.00,0.00,25.00,GES,GES,Bank,Salary,,31245678901,120.50,Pasted SMS',
    );
  });

  it('leaves blanks for missing values and never exports the raw SMS', () => {
    const csv = toCsv(
      [tx({ categoryId: null, counterparty: null, externalRef: null, balanceAfter: null, network: 'unknown', source: 'manual' })],
      new Map(),
      { currencyCode: 'GHS' },
    );
    expect(csv).not.toContain('secret raw text');
    expect(csv).toContain(',Typed in');
  });

  it('exports an empty history with metadata and header only', () => {
    const lines = toCsv([], new Map(), { currencyCode: 'GHS' }).split('\r\n').filter(Boolean);
    expect(lines.some((l) => l.startsWith('Date,'))).toBe(true);
    expect(CSV_COLUMNS[0]).toBe('Date');
  });

  it('labels amount columns with the chosen currency code', () => {
    const csv = toCsv([], new Map(), { currencyCode: 'USD' });
    expect(csv).toContain('Amount (USD)');
    expect(csv).toContain('Fee (USD)');
  });
});
