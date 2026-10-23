import type { Transaction } from '@/core/db/schema';

import { pdfText, statementPdf } from './pdf';

const tx = (over: Partial<Transaction>) =>
  ({
    occurredAt: '2026-10-02T10:00:00.000Z',
    type: 'send',
    direction: 'out',
    counterparty: null,
    employer: null,
    note: null,
    amount: 0,
    fee: 0,
    ...over,
  }) as Transaction;

describe('statement PDF', () => {
  it('builds a branded PDF with summary, columns, and publisher', () => {
    const pdf = statementPdf(
      'Statement — October 2026',
      [
        tx({ counterparty: 'Ama (Shop)', amount: 250000, fee: 50 }),
        tx({ type: 'cash_out', amount: 20000, fee: 200, counterparty: 'AGENT' }),
        tx({ type: 'receive', direction: 'in', amount: 300000, counterparty: 'Kofi' }),
      ],
      { currencyCode: 'GHS', periodLabel: 'October 2026' },
    );
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('SikaLens');
    expect(pdf).toContain('Celestial Web Solutions');
    expect(pdf).toContain('support@sikalens.app');
    expect(pdf).toContain('STATEMENT');
    expect(pdf).toContain('October 2026');
    expect(pdf).toContain('-GHS 2,500.00');
    expect(pdf).toContain('+GHS 3,000.00');
    expect(pdf).toContain('-GHS 2,700.00');
    expect(pdf).toContain('+GHS 300.00');
    expect(pdf).toContain('GHS 2.50');
    expect(pdf).toContain('Ama \\(Shop\\)');
    expect(pdf).toContain('RECEIVED');
    expect(pdf).toContain('/WinAnsiEncoding');
    expect(pdf).toContain('/Info 5 0 R');
    expect(pdf).not.toMatch(/[^\x00-\x7f]/);
    expect(pdf.endsWith('%%EOF\n')).toBe(true);
  });
});

describe('pdfText', () => {
  it('encodes accents, dashes and bullets instead of "?"', () => {
    expect(pdfText('Kwámè · Ama — “ok” •')).toBe('Kw\\341m\\350 \\267 Ama \\227 \\223ok\\224 \\225');
  });

  it('swaps the cedi sign and drops what Helvetica cannot draw', () => {
    expect(pdfText('₵5 😀')).toBe('GH\\2425 ');
  });
});
