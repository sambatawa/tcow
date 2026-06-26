import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { sendOtpEmail, isMailerConfigured, SMTP_NOT_CONFIGURED_MSG } from "@/lib/mailer";
import {
  generateOtpCode,
  hashOtp,
  otpExpiresAt,
  parsePayload,
} from "@/lib/otp";
import {
  assertCanResendCode,
  buildVerificationStatus,
  findVerificationRecord,
} from "@/lib/verification-service";
import { jsonError, jsonOk } from "@/lib/api-response";
import { normalizeEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    if (!isMailerConfigured()) {
      return jsonError(SMTP_NOT_CONFIGURED_MSG, 503);
    }

    const body = await request.json();
    const { email } = body as { email: string };

    if (!email?.trim()) {
      return jsonError("Email wajib diisi", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const existingRecord = await findVerificationRecord(normalizedEmail);

    if (!existingRecord) {
      return jsonError("Tidak ada permintaan verifikasi. Silakan daftar ulang.", 404);
    }

    const gate = await assertCanResendCode(existingRecord);
    if (!gate.ok) {
      return jsonError(gate.message, 429, {
        reason: gate.reason,
        retryAfterSeconds: gate.retryAfterSeconds,
        resendCount: gate.resendCount,
        remainingResends: gate.remainingResends,
        locked: gate.reason === "locked" || gate.reason === "resend_limit",
      });
    }

    const newCode = generateOtpCode();
    const newCodeHash = await hashOtp(newCode);
    const newExpiresAt = otpExpiresAt();
    const now = new Date();

    const payload = parsePayload(gate.record.payload);
    if (!payload) {
      return jsonError("Data pendaftaran tidak valid", 500);
    }

    const updated = await prisma.verifikasi_email.update({
      where: { id: gate.record.id },
      data: {
        codeHash: newCodeHash,
        expiresAt: newExpiresAt,
        resendCount: gate.record.resendCount + 1,
        lastResendAt: now,
      },
    });

    await sendOtpEmail(normalizedEmail, newCode, payload.name);

    const status = buildVerificationStatus(updated);

    return jsonOk({
      success: true,
      message: "Kode verifikasi baru telah dikirim ke email Anda.",
      ...status,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim ulang kode verifikasi",
      500
    );
  }
}
