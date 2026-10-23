import { isValidPin, isWeakPin, lockoutSeconds } from './pin-rules';

describe('isValidPin', () => {
  it.each(['1357', '2468', '9182'])('accepts %s', (p) => expect(isValidPin(p)).toBe(true));
  it.each(['', '123', '24680', '918273', '1234567', '12a4', '12 34', '١٢٣٤'])(
    'rejects "%s"',
    (p) => expect(isValidPin(p)).toBe(false),
  );
});

describe('isWeakPin', () => {
  it('flags the PINs everybody tries first', () => {
    expect(isWeakPin('1234')).toBe(true);
    expect(isWeakPin('0000')).toBe(true);
    expect(isWeakPin('1357')).toBe(false);
  });
});

describe('lockoutSeconds', () => {
  it('allows four free attempts, then slows the guesses down', () => {
    expect([1, 2, 3, 4].map(lockoutSeconds)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 20].map(lockoutSeconds)).toEqual([30, 60, 300, 900, 900]);
  });
});
