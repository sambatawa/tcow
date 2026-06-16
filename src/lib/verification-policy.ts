export const OTP_TTL_MS = 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_RESENDS_PER_CYCLE = 3;
export const LOCK_DURATION_MS = 60 * 60 * 1000;
export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function secondsUntil(target: Date | null | undefined): number {
  if (!target) return 0;
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 1000));
}

export function isCodeExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
