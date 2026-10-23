import { formatGHS, pesewasToInput, toPesewas, tryToPesewas } from './money';

describe('toPesewas', () => {
  it.each([
    ['25', 2500],
    ['25.5', 2550],
    ['25.05', 2505],
    ['1,200.50', 120050],
    ['GHS 0.99', 99],
    ['0.1', 10],
    [12.34, 1234],
  ])('%s -> %i', (input, expected) => {
    expect(toPesewas(input)).toBe(expected);
  });

  it('truncates beyond 2 decimal places instead of rounding up', () => {
    expect(toPesewas('1.999')).toBe(199);
  });

  it('throws on non-numeric input', () => {
    expect(() => toPesewas('abc')).toThrow();
    expect(tryToPesewas('')).toBeNull();
  });
});

describe('formatGHS', () => {
  it('formats with grouping and two decimals', () => {
    expect(formatGHS(123456)).toBe('GH₵1,234.56');
    expect(formatGHS(5)).toBe('GH₵0.05');
    expect(formatGHS(0)).toBe('GH₵0.00');
  });
  it('handles signs', () => {
    expect(formatGHS(-250)).toBe('-GH₵2.50');
    expect(formatGHS(250, { sign: true })).toBe('+GH₵2.50');
  });
  it('round-trips for inputs', () => {
    expect(pesewasToInput(2500)).toBe('25.00');
  });
});
