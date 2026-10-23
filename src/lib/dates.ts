/** Ghana is on GMT all year (no daylight saving), so UTC == local time. */
export function currentMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7); // 'YYYY-MM'
}

/** Local clock greeting: Good morning / afternoon / evening. */
export function dayGreeting(now: Date = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Login / lock greeting: time of day + welcome-back line. */
export function lockGreeting(profileName: string | null | undefined, now: Date = new Date()): {
  hello: string;
  welcome: string;
  initial: string;
} {
  const hello = dayGreeting(now);
  const name = profileName?.trim() || null;
  return {
    hello,
    welcome: name ? `Welcome back, ${name}` : 'Welcome back',
    initial: (name?.charAt(0) || 'S').toUpperCase(),
  };
}

/** [start, end) ISO bounds for a 'YYYY-MM' month. */
export function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

/** True when `value` is a real calendar day as YYYY-MM-DD. */
export function isDateInput(value: string): boolean {
  const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return false;
  const [y, mo, day] = [+m[1], +m[2], +m[3]];
  const dt = new Date(Date.UTC(y, mo - 1, day));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === day;
}

/**
 * Inclusive calendar range as [start, end) ISO bounds.
 * `from` / `to` are YYYY-MM-DD (Ghana == UTC).
 */
export function dateRangeBounds(from: string, to: string): { start: string; end: string } | null {
  if (!isDateInput(from) || !isDateInput(to)) return null;
  const a = from.trim();
  const b = to.trim();
  const first = a <= b ? a : b;
  const last = a <= b ? b : a;
  const [y, m, d] = last.split('-').map(Number);
  return {
    start: `${first}T00:00:00.000Z`,
    end: new Date(Date.UTC(y, m - 1, d + 1)).toISOString(),
  };
}

/** Human label for an inclusive YYYY-MM-DD range. */
export function dateRangeLabel(from: string, to: string): string {
  const a = from.trim();
  const b = to.trim();
  const first = a <= b ? a : b;
  const last = a <= b ? b : a;
  const fmt = (isoDay: string) =>
    new Date(`${isoDay}T00:00:00.000Z`).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return first === last ? fmt(first) : `${fmt(first)} – ${fmt(last)}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** '2026-10-20T14:32:00.000Z' -> '2026-10-20' (for the date input) */
export function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

/** '2026-10-20T14:32:00.000Z' -> '14:32' (24-hour, for the time input) */
export function toTimeInput(iso: string): string {
  return iso.slice(11, 16);
}

/**
 * Combines "YYYY-MM-DD" and "HH:MM" (24-hour, Ghana time == UTC) into an ISO string.
 * Returns null when either part is not a real date or time. An empty time means 00:00.
 */
export function parseDateTime(date: string, time: string): string | null {
  const d = date.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const t = (time.trim() || '00:00').match(/^(\d{1,2}):(\d{2})$/);
  if (!d || !t) return null;
  const [y, mo, day, h, mi] = [+d[1], +d[2], +d[3], +t[1], +t[2]];
  const dt = new Date(Date.UTC(y, mo - 1, day, h, mi));
  const valid =
    dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === day && h < 24 && mi < 60;
  return valid ? dt.toISOString() : null;
}

/** Number of days in a 'YYYY-MM' month. */
export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Move a 'YYYY-MM' month by `delta` months. Negative goes backward. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** The date `days` before `from`, as an ISO string. */
export function daysAgo(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() - days * 86_400_000).toISOString();
}
