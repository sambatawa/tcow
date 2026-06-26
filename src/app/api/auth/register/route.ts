import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import {
  hashPassword,
  validatePassword,
  verifyRegistrationKode,
} from "@/lib/auth";
import { sendOtpEmail, isMailerConfigured, SMTP_NOT_CONFIGURED_MSG } from "@/lib/mailer";
import {
  generateOtpCode,
  hashOtp,
  otpExpiresAt,
  serializePayload,
} from "@/lib/otp";
import { jsonError, jsonOk } from "@/lib/api-response";
import { isValidEmailFormat, normalizeEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    if (!isMailerConfigured()) {
      return jsonError(`${SMTP_NOT_CONFIGURED_MSG} (lihat .env.example).`, 503);
    }

    const body = await request.json();
    const {
      no_kode,
      name,
      email,
      password,
      alamat = "",
    } = body as {
      no_kode: string;
      name: string;
      email: string;
      password: string;
      alamat?: string;
    };

    if (!no_kode?.trim() || !name?.trim() || !email?.trim() || !password) {
      return jsonError("No kode, nama, email, dan password wajib diisi", 400);
    }

    if (!verifyRegistrationKode(no_kode)) {
      return jsonError("No kode tidak valid", 403);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return jsonError(passwordError, 400);
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmailFormat(normalizedEmail)) {
      return jsonError("Format email tidak valid", 400);
    }

    const existing = await prisma.pengguna.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return jsonError("Email sudah terdaftar", 409);
    }

    const code = generateOtpCode();
    const codeHash = await hashOtp(code);
    const passwordHash = await hashPassword(password);
    const now = new Date();

    await prisma.verifikasi_email.deleteMany({
      where: { email: normalizedEmail },
    });

    await prisma.verifikasi_email.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        codeHash,
        payload: serializePayload({
          no_kode: no_kode.trim().toUpperCase(),
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          alamat: alamat.trim() || undefined,
        }),
        expiresAt: otpExpiresAt(),
        lastResendAt: now,
        resendCount: 0,
      },
    });

    await sendOtpEmail(normalizedEmail, code, name.trim());

    return jsonOk({
      success: true,
      needsVerification: true,
      email: normalizedEmail,
      message: "Kode verifikasi telah dikirim ke email Anda.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim kode verifikasi",
      500
    );
  }
}
