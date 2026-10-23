import {
  currentMonth,
  dateRangeBounds,
  dateRangeLabel,
  daysAgo,
  isDateInput,
  monthBounds,
  parseDateTime,
  toDateInput,
  toTimeInput,
} from './dates';

describe('parseDateTime', () => {
  it('builds an ISO string from the two inputs', () => {
    expect(parseDateTime('2026-10-20', '14:32')).toBe('2026-10-20T14:32:00.000Z');
    expect(parseDateTime('2026-1-5', '9:05')).toBe('2026-01-05T09:05:00.000Z');
  });
  it('treats an empty time as midnight', () => {
    expect(parseDateTime('2026-10-20', '')).toBe('2026-10-20T00:00:00.000Z');
  });
  it.each([
    ['2026-02-30', '10:00'], // no such day
    ['2026-13-01', '10:00'], // no such month
    ['20-10-2026', '10:00'], // wrong order
    ['2026-10-20', '24:00'],
    ['2026-10-20', '10:75'],
    ['2026-10-20', '10am'],
    ['', ''],
  ])('rejects %s %s', (d, t) => {
    expect(parseDateTime(d, t)).toBeNull();
  });
});

describe('date helpers', () => {
  it('splits an ISO string for the inputs', () => {
    expect(toDateInput('2026-10-20T14:32:00.000Z')).toBe('2026-10-20');
    expect(toTimeInput('2026-10-20T14:32:00.000Z')).toBe('14:32');
  });
  it('goes back whole days', () => {
    expect(toDateInput(daysAgo(1, new Date('2026-10-20T08:00:00Z')))).toBe('2026-10-19');
  });
  it('knows month boundaries, including December', () => {
    expect(monthBounds('2026-12')).toEqual({ start: '2026-12-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' });
    expect(currentMonth(new Date('2026-10-21T10:00:00Z'))).toBe('2026-10');
  });
  it('builds inclusive date ranges and labels', () => {
    expect(isDateInput('2026-10-31')).toBe(true);
    expect(isDateInput('2026-02-30')).toBe(false);
    expect(dateRangeBounds('2026-10-05', '2026-10-01')).toEqual({
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-10-06T00:00:00.000Z',
    });
    expect(dateRangeLabel('2026-10-01', '2026-10-01')).toBe('1 Oct 2026');
    expect(dateRangeLabel('2026-10-01', '2026-10-31')).toContain('1 Oct 2026');
    expect(dateRangeLabel('2026-10-01', '2026-10-31')).toContain('31 Oct 2026');
  });
});
