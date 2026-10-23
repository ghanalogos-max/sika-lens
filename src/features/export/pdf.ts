import type { Transaction } from '@/core/db/schema';
import { getDisplayCurrency, moneyCodeLabel } from '@/core/money/money';
import { APP_NAME, APP_OWNER, SUPPORT_EMAIL } from '@/features/about/brand';
import { TYPE_LABEL } from '@/features/transactions/labels';

/** Brand colours as PDF RGB fractions (match `src/ui/theme.ts`). */
const C = {
  lagoon: '0.055 0.416 0.384',
  lagoonDeep: '0.035 0.310 0.286',
  lagoonSoft: '0.843 0.937 0.918',
  gold: '0.659 0.420 0.071',
  goldSoft: '0.965 0.906 0.784',
  paper: '0.965 0.953 0.918',
  ink: '0.110 0.141 0.188',
  inkSoft: '0.431 0.459 0.431',
  line: '0.906 0.882 0.831',
  moneyIn: '0.110 0.541 0.337',
  moneyOut: '0.831 0.325 0.243',
  white: '1 1 1',
} as const;

const PAGE_W = 595;
const PAGE_H = 842;
const LEFT = 48;
const RIGHT = PAGE_W - 48;
const HEADER_H = 96;

/** Unicode characters outside Latin-1 that WinAnsiEncoding still carries (byte value). */
const WIN_ANSI_EXTRA: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89,
  'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95,
  '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

const SUBSTITUTE: Record<string, string> = { '₵': 'GH¢', '₦': 'N', '−': '-', '\u00A0': ' ' };

/**
 * Escapes text for a PDF string drawn in WinAnsi Helvetica. Non-ASCII bytes are
 * written as octal escapes so the file stays plain ASCII. Anything Helvetica
 * cannot draw (emoji, other scripts) is dropped rather than shown as "?".
 */
export function pdfText(value: string): string {
  let out = '';
  for (const raw of value) {
    const ch = SUBSTITUTE[raw] ?? raw;
    for (const c of ch) {
      const code = c.codePointAt(0)!;
      if (c === '\\' || c === '(' || c === ')') out += `\\${c}`;
      else if (code >= 0x20 && code <= 0x7e) out += c;
      else if (code >= 0xa0 && code <= 0xff) out += `\\${code.toString(8).padStart(3, '0')}`;
      else if (WIN_ANSI_EXTRA[c] != null) out += `\\${WIN_ANSI_EXTRA[c].toString(8)}`;
      else {
        const plain = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (plain !== c && /^[\x20-\x7e]+$/.test(plain)) out += plain;
      }
    }
  }
  return out;
}

const HELV: Record<string, number> = {
  ' ': 278, '.': 278, ',': 278, '+': 584, '-': 333, '/': 278, ':': 278, '(': 333, ')': 333,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833,
  N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833,
  n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556,
};
const HELV_BOLD_SCALE = 1.06;

function textWidth(value: string, size: number, bold = false): number {
  let w = 0;
  for (const c of value) w += HELV[c] ?? 556;
  return (w / 1000) * size * (bold ? HELV_BOLD_SCALE : 1);
}

function fit(value: string, size: number, maxWidth: number): string {
  if (textWidth(value, size) <= maxWidth) return value;
  let s = value;
  while (s.length > 1 && textWidth(`${s}...`, size) > maxWidth) s = s.slice(0, -1);
  return `${s.trimEnd()}...`;
}

function amountText(minor: number): string {
  const [whole, cents] = (Math.abs(minor) / 100).toFixed(2).split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}

function text(x: number, y: number, value: string, size: number, opts?: { bold?: boolean; color?: string }) {
  return [
    `${opts?.color ?? C.ink} rg`,
    'BT',
    `/${opts?.bold ? 'F2' : 'F1'} ${size} Tf`,
    `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
    `(${pdfText(value)}) Tj`,
    'ET',
  ].join('\n');
}

function textRight(right: number, y: number, value: string, size: number, opts?: { bold?: boolean; color?: string }) {
  return text(right - textWidth(value, size, opts?.bold), y, value, size, opts);
}

function rect(x: number, y: number, w: number, h: number, color: string) {
  return `${color} rg\n${x} ${y} ${w} ${h} re f`;
}

function hline(y: number, color: string, width = 0.6) {
  return `${color} RG\n${width} w\n${LEFT} ${y} m ${RIGHT} ${y} l S`;
}

function buildPdf(streams: string[], meta: { title: string; period: string }): string {
  const parts: string[] = [];
  const pageCount = streams.length;
  let id = 6;
  const pages: { pageId: number; contentId: number; stream: string }[] = [];
  for (const stream of streams) {
    const contentId = id++;
    const pageId = id++;
    pages.push({ pageId, contentId, stream });
  }

  const infoTitle = pdfText(`${APP_NAME} — ${meta.period}`);
  const infoAuthor = pdfText(APP_OWNER);

  parts.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  parts.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pages.map((p) => `${p.pageId} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`,
  );
  parts.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
  parts.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');
  parts.push(
    `5 0 obj\n<< /Title (${infoTitle}) /Author (${infoAuthor}) /Creator (${pdfText(APP_NAME)}) /Producer (${pdfText(`${APP_NAME} by ${APP_OWNER}`)}) >>\nendobj\n`,
  );
  for (const p of pages) {
    parts.push(`${p.contentId} 0 obj\n<< /Length ${p.stream.length} >>\nstream\n${p.stream}\nendstream\nendobj\n`);
    parts.push(
      `${p.pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${p.contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj\n`,
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const part of parts) {
    offsets.push(pdf.length);
    pdf += part;
  }
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${parts.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= parts.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${parts.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return pdf;
}

/**
 * Brand-first header: lagoon plane, SikaLens as the hero wordmark,
 * publisher under the name — period and meta live on the page body, not crowded into the band.
 */
function header(periodLabel: string, code: string, generated: string): string[] {
  const bandBottom = PAGE_H - HEADER_H;
  return [
    rect(0, bandBottom, PAGE_W, HEADER_H, C.lagoon),
    // Brand
    text(LEFT, bandBottom + 52, APP_NAME, 28, { bold: true, color: C.white }),
    text(LEFT, bandBottom + 32, APP_OWNER, 11, { color: C.goldSoft }),
    // Right label
    textRight(RIGHT, bandBottom + 54, 'STATEMENT', 10, { bold: true, color: C.gold }),
    textRight(RIGHT, bandBottom + 38, 'MoMo & bank', 9, { color: C.lagoonSoft }),
    // Period block on the paper
    text(LEFT, bandBottom - 28, periodLabel, 16, { bold: true, color: C.ink }),
    text(LEFT, bandBottom - 46, `Currency ${code}   ·   Generated ${generated}`, 9, { color: C.inkSoft }),
  ];
}

function footer(page: number, pageCount: number): string[] {
  return [
    rect(0, 0, PAGE_W, 52, C.lagoonDeep),
    text(LEFT, 30, APP_NAME, 10, { bold: true, color: C.white }),
    text(LEFT + textWidth(APP_NAME, 10, true) + 8, 30, APP_OWNER, 8, { color: C.goldSoft }),
    text(LEFT, 16, SUPPORT_EMAIL, 8, { color: C.lagoonSoft }),
    textRight(RIGHT, 30, `Page ${page} of ${pageCount}`, 9, { bold: true, color: C.white }),
    textRight(RIGHT, 16, 'Saved on your phone · not a bank statement', 7, { color: C.lagoonSoft }),
  ];
}

function summaryCard(x: number, y: number, w: number, label: string, value: string, color: string): string[] {
  return [
    rect(x, y, w, 52, C.paper),
    text(x + 12, y + 32, label, 8, { bold: true, color: C.inkSoft }),
    text(x + 12, y + 12, fit(value, 12, w - 20), 12, { bold: true, color }),
  ];
}

const COL = { date: LEFT + 6, type: LEFT + 76, detail: LEFT + 158, feeRight: RIGHT - 96, amountRight: RIGHT - 6 };

export function statementPdf(
  title: string,
  rows: Transaction[],
  opts?: { currencyCode?: string; periodLabel?: string },
): string {
  const code = opts?.currencyCode ?? moneyCodeLabel(getDisplayCurrency());
  const generated = new Date().toISOString().slice(0, 10);
  const stripped = title.replace(/^Statement\s+[—–-]\s*/i, '');
  const periodLabel = opts?.periodLabel ?? (stripped || title);

  let received = 0;
  let spent = 0;
  let fees = 0;
  for (const tx of rows) {
    if (tx.type === 'receive' || tx.type === 'salary') received += tx.amount;
    else if (tx.direction === 'out') spent += tx.amount;
    fees += tx.fee ?? 0;
  }
  const net = received - spent;

  const detailWidth = COL.feeRight - 48 - COL.detail;
  const lines = rows.map((tx) => {
    const who = tx.counterparty ?? tx.employer ?? '';
    const note = tx.note?.trim() ?? '';
    const detail = [who, note].filter(Boolean).join('  ·  ') || '—';
    return {
      date: tx.occurredAt.slice(0, 10),
      type: TYPE_LABEL[tx.type],
      detail: fit(detail, 9, detailWidth),
      fee: tx.fee ? amountText(tx.fee) : '',
      amount: `${tx.direction === 'in' ? '+' : '-'}${code} ${amountText(tx.amount)}`,
      inflow: tx.direction === 'in',
    };
  });

  const rowH = 18;
  const firstTop = PAGE_H - HEADER_H - 128;
  const otherTop = PAGE_H - HEADER_H - 56;
  const bottom = 68;
  const firstCap = Math.max(1, Math.floor((firstTop - bottom) / rowH));
  const otherCap = Math.max(1, Math.floor((otherTop - bottom) / rowH));
  const pageCount = lines.length <= firstCap ? 1 : 1 + Math.ceil((lines.length - firstCap) / otherCap);

  const streams: string[] = [];
  let cursor = 0;
  for (let page = 0; page < pageCount; page++) {
    const cap = page === 0 ? firstCap : otherCap;
    const slice = lines.slice(cursor, cursor + cap);
    cursor += cap;
    const cmds: string[] = header(periodLabel, code, generated);

    if (page === 0) {
      const gap = 8;
      const w = (RIGHT - LEFT - gap * 3) / 4;
      const y = PAGE_H - HEADER_H - 108;
      cmds.push(
        ...summaryCard(LEFT, y, w, 'RECEIVED', `+${code} ${amountText(received)}`, C.moneyIn),
        ...summaryCard(LEFT + (w + gap), y, w, 'SPENT', `-${code} ${amountText(spent)}`, C.moneyOut),
        ...summaryCard(LEFT + (w + gap) * 2, y, w, 'FEES', `${code} ${amountText(fees)}`, C.gold),
        ...summaryCard(
          LEFT + (w + gap) * 3,
          y,
          w,
          'NET',
          `${net >= 0 ? '+' : '-'}${code} ${amountText(net)}`,
          net >= 0 ? C.lagoon : C.moneyOut,
        ),
      );
    }

    const top = page === 0 ? firstTop : otherTop;
    cmds.push(
      rect(LEFT, top, RIGHT - LEFT, 22, C.lagoon),
      text(COL.date, top + 7, 'Date', 9, { bold: true, color: C.white }),
      text(COL.type, top + 7, 'Type', 9, { bold: true, color: C.white }),
      text(COL.detail, top + 7, 'Details', 9, { bold: true, color: C.white }),
      textRight(COL.feeRight, top + 7, 'Fee', 9, { bold: true, color: C.white }),
      textRight(COL.amountRight, top + 7, 'Amount', 9, { bold: true, color: C.white }),
    );

    let y = top - rowH;
    if (slice.length === 0 && page === 0) {
      cmds.push(text(COL.date, y + 5, 'No transactions in this period.', 10, { color: C.inkSoft }));
    }
    slice.forEach((line, i) => {
      if (i % 2 === 1) cmds.push(rect(LEFT, y, RIGHT - LEFT, rowH, C.paper));
      cmds.push(
        text(COL.date, y + 5.5, line.date, 9, { color: C.inkSoft }),
        text(COL.type, y + 5.5, line.type, 9, { bold: true }),
        text(COL.detail, y + 5.5, line.detail, 9),
        textRight(COL.feeRight, y + 5.5, line.fee, 9, { color: C.inkSoft }),
        textRight(COL.amountRight, y + 5.5, line.amount, 9, {
          bold: true,
          color: line.inflow ? C.moneyIn : C.moneyOut,
        }),
      );
      y -= rowH;
    });
    cmds.push(hline(y + rowH, C.line));

    cmds.push(...footer(page + 1, pageCount));
    streams.push(cmds.join('\n'));
  }
  return buildPdf(streams, { title, period: periodLabel });
}
