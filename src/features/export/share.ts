import { and, asc, eq, gte, isNull, lt, or, type SQL } from 'drizzle-orm';
import { Directory, File, Paths } from 'expo-file-system';
import {
  EncodingType,
  StorageAccessFramework,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { db } from '@/core/db/client';
import { transactions, type Transaction } from '@/core/db/schema';
import { getDisplayCurrency, moneyCodeLabel } from '@/core/money/money';
import { listAccounts } from '@/features/accounts/repository';
import { listCategories } from '@/features/transactions/repository';
import { dateRangeBounds, dateRangeLabel, monthBounds, monthLabel } from '@/lib/dates';

import { toCsv } from './csv';
import { statementPdf } from './pdf';

export type ExportFormat = 'csv' | 'pdf';
/** Share opens the system sheet; save writes onto this phone (Downloads / Files). */
export type ExportDestination = 'share' | 'save';
export type ExportResult =
  | { ok: true; rows: number; destination: ExportDestination; pathHint?: string }
  | { ok: false; reason: 'empty' | 'sharing_unavailable' | 'bad_range' | 'save_cancelled' | 'save_failed' };

export type ExportPeriod =
  | { kind: 'all' }
  | { kind: 'month'; month: string }
  | { kind: 'range'; from: string; to: string };

function resolvePeriod(period: ExportPeriod | string | undefined): {
  where: SQL | undefined;
  label: string;
  stamp: string;
  title: string;
} | { error: 'bad_range' } {
  if (period == null || typeof period === 'string') {
    if (!period) {
      return {
        where: undefined,
        label: 'All transactions',
        stamp: 'all',
        title: 'Statement — all transactions',
      };
    }
    return {
      where: (() => {
        const { start, end } = monthBounds(period);
        return and(gte(transactions.occurredAt, start), lt(transactions.occurredAt, end));
      })(),
      label: monthLabel(period),
      stamp: period,
      title: `Statement — ${monthLabel(period)}`,
    };
  }

  if (period.kind === 'all') {
    return {
      where: undefined,
      label: 'All transactions',
      stamp: 'all',
      title: 'Statement — all transactions',
    };
  }

  if (period.kind === 'month') {
    const { start, end } = monthBounds(period.month);
    return {
      where: and(gte(transactions.occurredAt, start), lt(transactions.occurredAt, end)),
      label: monthLabel(period.month),
      stamp: period.month,
      title: `Statement — ${monthLabel(period.month)}`,
    };
  }

  const bounds = dateRangeBounds(period.from, period.to);
  if (!bounds) return { error: 'bad_range' };
  const label = dateRangeLabel(period.from, period.to);
  const first = period.from.trim() <= period.to.trim() ? period.from.trim() : period.to.trim();
  const last = period.from.trim() <= period.to.trim() ? period.to.trim() : period.from.trim();
  return {
    where: and(gte(transactions.occurredAt, bounds.start), lt(transactions.occurredAt, bounds.end)),
    label,
    stamp: `${first}_${last}`,
    title: `Statement — ${label}`,
  };
}

/**
 * One wallet: rows tagged with that account, plus older MoMo SMS for its sync network
 * that never stored accountId.
 */
function accountWhere(accountId: number | null | undefined): SQL | undefined {
  if (accountId == null) return undefined;
  const account = listAccounts().find((a) => a.id === accountId);
  if (!account) return eq(transactions.accountId, accountId);
  const sync = account.syncNetwork && account.syncNetwork !== 'unknown' ? account.syncNetwork : null;
  if (sync) {
    return or(
      eq(transactions.accountId, accountId),
      and(eq(transactions.network, sync), isNull(transactions.accountId)),
    );
  }
  return eq(transactions.accountId, accountId);
}

function mimeFor(format: ExportFormat) {
  return format === 'pdf' ? 'application/pdf' : 'text/csv';
}

function buildContent(
  format: ExportFormat,
  rows: Transaction[],
  resolved: { title: string; label: string },
  code: string,
): string {
  if (format === 'pdf') {
    return statementPdf(resolved.title, rows, { currencyCode: code, periodLabel: resolved.label });
  }
  const names = new Map(listCategories().map((c) => [c.id, c.name]));
  return toCsv(rows, names, { currencyCode: code, periodLabel: resolved.label });
}

/** Persist into the app Documents folder (always available). */
function writeToDocuments(fileName: string, content: string): File {
  const dir = new Directory(Paths.document, 'exports');
  if (!dir.exists) dir.create();
  const file = new File(dir, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  return file;
}

/**
 * Android: user picks a folder (e.g. Downloads) via Storage Access Framework.
 * iOS: file is kept in Documents and the share sheet opens so they can Save to Files.
 */
async function saveToDevice(fileName: string, content: string, format: ExportFormat): Promise<{ pathHint: string }> {
  if (Platform.OS === 'android') {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    const dest = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName.replace(/\.[^.]+$/, ''),
      mimeFor(format),
    );
    await writeAsStringAsync(dest, content, { encoding: EncodingType.UTF8 });
    return { pathHint: 'Saved to the folder you chose (e.g. Downloads).' };
  }

  const file = writeToDocuments(fileName, content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: mimeFor(format),
      UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
      dialogTitle: 'Save SikaLens export',
    });
  }
  return { pathHint: 'Saved in SikaLens Documents. Use Save to Files if you want it in Files.' };
}

function safeStampPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

/** Builds a CSV or PDF, then shares it or saves it onto this phone. */
export async function exportTransactions(
  period?: ExportPeriod | string,
  format: ExportFormat = 'csv',
  destination: ExportDestination = 'share',
  accountId?: number | null,
): Promise<ExportResult> {
  const resolved = resolvePeriod(period);
  if ('error' in resolved) return { ok: false, reason: 'bad_range' };

  const account = accountId != null ? listAccounts().find((a) => a.id === accountId) : null;
  const accountLabel = account?.name ?? null;
  const periodLabel = accountLabel ? `${resolved.label} · ${accountLabel}` : resolved.label;
  const title = accountLabel
    ? resolved.title.replace(/^Statement — /, `Statement — ${accountLabel} · `)
    : resolved.title;
  const stamp = accountLabel
    ? `${resolved.stamp}-${safeStampPart(accountLabel) || `a${accountId}`}`
    : resolved.stamp;

  const where = and(resolved.where, accountWhere(accountId));
  const rows = db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(asc(transactions.occurredAt))
    .all();
  if (rows.length === 0) return { ok: false, reason: 'empty' };

  const code = moneyCodeLabel(getDisplayCurrency());
  const fileName = `sikalens-${stamp}.${format}`;
  const content = buildContent(format, rows, { title, label: periodLabel }, code);

  if (destination === 'save') {
    try {
      const { pathHint } = await saveToDevice(fileName, content, format);
      return { ok: true, rows: rows.length, destination: 'save', pathHint };
    } catch (e) {
      const codeName = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (codeName === 'cancelled') return { ok: false, reason: 'save_cancelled' };
      return { ok: false, reason: 'save_failed' };
    }
  }

  if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'sharing_unavailable' };
  const file = writeToDocuments(fileName, content);
  await Sharing.shareAsync(file.uri, {
    mimeType: mimeFor(format),
    UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
    dialogTitle: format === 'pdf' ? 'SikaLens statement' : 'Export SikaLens for Excel',
  });
  return { ok: true, rows: rows.length, destination: 'share' };
}
