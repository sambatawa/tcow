import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  MSG,
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword } = body as {
      email: string;
      password: string;
      confirmPassword?: string;
    };

    if (!email?.trim() || !password) {
      return jsonError("Email dan password baru wajib diisi", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmailFormat(normalizedEmail)) {
      return jsonError(MSG.emailInvalid, 400);
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return jsonError(MSG.passwordMismatch, 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return jsonError(passwordError, 400);
    }

    const pengguna = await prisma.pengguna.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pengguna) {
      return jsonError("Email tidak terdaftar", 404);
    }

    const passwordHash = await hashPassword(password);
    await prisma.pengguna.update({
      where: { email: normalizedEmail },
      data: { password: passwordHash },
    });

    return jsonOk({
      success: true,
      message: "Password berhasil diubah. Silakan masuk.",
    });
  } catch {
    return jsonError("Gagal mengubah password", 500);
  }
}
