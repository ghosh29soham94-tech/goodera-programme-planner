import "server-only";

const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000;

interface Entry {
  failures: number;
  lockedUntil: number;
}

const attempts = new Map<string, Entry>();

/** Milliseconds left on a lock for this IP, or 0. */
export function lockRemaining(ip: string): number {
  const e = attempts.get(ip);
  if (!e) return 0;
  const left = e.lockedUntil - Date.now();
  if (left > 0) return left;
  if (e.lockedUntil) attempts.delete(ip); // lock expired: start fresh
  return 0;
}

/** Records a failure. Returns attempts left before lock (0 = now locked). */
export function recordFailure(ip: string): number {
  const e = attempts.get(ip) ?? { failures: 0, lockedUntil: 0 };
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) e.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(ip, e);
  return Math.max(0, MAX_FAILURES - e.failures);
}

export function recordSuccess(ip: string): void {
  attempts.delete(ip);
}
