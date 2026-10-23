/** Exactly 4 digits, nothing else. */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** PINs people pick first. Rejected so the lock is worth having. */
const COMMON = new Set(['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '1212', '1122', '2580']);

export function isWeakPin(pin: string): boolean {
  return COMMON.has(pin);
}

/** How long to block further attempts after this many wrong PINs in a row. */
export function lockoutSeconds(failedAttempts: number): number {
  if (failedAttempts < 5) return 0;
  if (failedAttempts === 5) return 30;
  if (failedAttempts === 6) return 60;
  if (failedAttempts === 7) return 300;
  return 900;
}
