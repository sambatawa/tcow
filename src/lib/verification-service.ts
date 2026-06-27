import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import {
  LOCK_DURATION_MS,
  MAX_RESENDS_PER_CYCLE,
  RESEND_COOLDOWN_MS,
  addMs,
  isCodeExpired,
  secondsUntil,
} from "@/lib/verification-policy";
import { formatDurationSeconds } from "@/lib/format";

export type VerificationBlockReason =
  | "locked"
  | "resend_cooldown"
  | "resend_limit";

export type VerificationRecord = {
  id: string;
  email: string;
  codeHash: string;
  payload: string;
  expiresAt: Date;
  createdAt: Date;
  resendCount: number;
  lastResendAt: Date | null;
  cooldownUntil: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
};

export type VerificationGateResult =
  | { ok: true; record: VerificationRecord }
  | {
      ok: false;
      reason: VerificationBlockReason;
      message: string;
      retryAfterSeconds: number;
      resendCount: number;
      remainingResends: number;
    };

export async function findVerificationRecord(email: string) {
  return prisma.verifikasi_email.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
}

export async function refreshVerificationCycle(
  record: VerificationRecord
): Promise<VerificationRecord> {
  const now = new Date();
  if (record.lockedUntil && record.lockedUntil <= now) {
    const updated = await prisma.verifikasi_email.update({
      where: { id: record.id },
      data: {
        lockedUntil: null,
        cooldownUntil: null,
        resendCount: 0,
      },
    });
    return updated as VerificationRecord;
  }
  if (
    record.cooldownUntil &&
    record.cooldownUntil <= now &&
    record.resendCount >= MAX_RESENDS_PER_CYCLE
  ) {
    const updated = await prisma.verifikasi_email.update({
      where: { id: record.id },
      data: {
        cooldownUntil: null,
        resendCount: 0,
      },
    });
    return updated as VerificationRecord;
  }
  return record;
}

export async function recordVerificationLockWarning(
  email: string,
  verifikasiId: string,
  resendCount: number
) {
  await prisma.peringatan_verifikasi.create({
    data: {
      id: randomUUID(),
      email,
      jenis: "lock_resend_limit",
      pesan: `Pengguna ${email} terkunci 1 jam setelah ${resendCount} kali kirim ulang kode verifikasi.`,
      metadata: JSON.stringify({
        verifikasiId,
        resendCount,
        lockedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function applyResendLock(record: VerificationRecord) {
  const lockedUntil = addMs(new Date(), LOCK_DURATION_MS);
  await recordVerificationLockWarning(
    record.email,
    record.id,
    record.resendCount
  );
  return prisma.verifikasi_email.update({
    where: { id: record.id },
    data: {
      lockedUntil,
      cooldownUntil: lockedUntil,
      lastResendAt: new Date(),
    },
  });
}

export async function assertCanResendCode(
  record: VerificationRecord
): Promise<VerificationGateResult> {
  const refreshed = await refreshVerificationCycle(record);

  if (refreshed.lockedUntil && refreshed.lockedUntil > new Date()) {
    const retryAfterSeconds = secondsUntil(refreshed.lockedUntil);
    return {
      ok: false,
      reason: "locked",
      message: `Terlalu banyak permintaan kode. Coba lagi dalam ${formatDurationSeconds(retryAfterSeconds)}.`,
      retryAfterSeconds,
      resendCount: refreshed.resendCount,
      remainingResends: 0,
    };
  }

  if (refreshed.resendCount >= MAX_RESENDS_PER_CYCLE) {
    await applyResendLock(refreshed);
    return {
      ok: false,
      reason: "resend_limit",
      message:
        "Batas kirim ulang kode (3 kali) tercapai. Akun verifikasi dikunci selama 1 jam.",
      retryAfterSeconds: Math.ceil(LOCK_DURATION_MS / 1000),
      resendCount: refreshed.resendCount,
      remainingResends: 0,
    };
  }

  if (refreshed.lastResendAt) {
    const nextAllowed = addMs(refreshed.lastResendAt, RESEND_COOLDOWN_MS);
    const waitSeconds = secondsUntil(nextAllowed);
    if (waitSeconds > 0) {
      return {
        ok: false,
        reason: "resend_cooldown",
        message: `Tunggu ${waitSeconds} detik sebelum meminta kode baru.`,
        retryAfterSeconds: waitSeconds,
        resendCount: refreshed.resendCount,
        remainingResends: MAX_RESENDS_PER_CYCLE - refreshed.resendCount,
      };
    }
  }

  return {
    ok: true,
    record: refreshed,
  };
}

export function buildVerificationStatus(record: VerificationRecord) {
  const now = new Date();
  const locked =
    record.lockedUntil !== null && record.lockedUntil > now;
  const lockSeconds = locked ? secondsUntil(record.lockedUntil) : 0;

  let resendCooldownSeconds = 0;
  if (!locked && record.lastResendAt) {
    const nextAllowed = addMs(record.lastResendAt, RESEND_COOLDOWN_MS);
    resendCooldownSeconds = secondsUntil(nextAllowed);
  }

  const remainingResends = locked
    ? 0
    : Math.max(0, MAX_RESENDS_PER_CYCLE - record.resendCount);

  const canResend =
    !locked &&
    remainingResends > 0 &&
    resendCooldownSeconds === 0 &&
    record.resendCount < MAX_RESENDS_PER_CYCLE;

  return {
    email: record.email,
    resendCount: record.resendCount,
    remainingResends,
    maxResendsPerCycle: MAX_RESENDS_PER_CYCLE,
    canResend,
    locked,
    lockSecondsRemaining: lockSeconds,
    resendCooldownSeconds,
    codeExpired: isCodeExpired(record.expiresAt),
    codeExpiresInSeconds: secondsUntil(record.expiresAt),
    expiresAt: record.expiresAt.toISOString(),
  };
}
