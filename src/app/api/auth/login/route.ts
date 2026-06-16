import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { serializePengguna } from "@/lib/pengguna";
import { jsonError, jsonOk } from "@/lib/api-response";
import { normalizeEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (!email?.trim() || !password) {
      return jsonError("Email dan password wajib diisi", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const pengguna = await prisma.pengguna.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pengguna) {
      return jsonError("Email atau password salah", 401);
    }

    const valid = await verifyPassword(password, pengguna.password);
    if (!valid) {
      return jsonError("Email atau password salah", 401);
    }

    const updated = await prisma.pengguna.update({
      where: { uid: pengguna.uid },
      data: { lastLogin: new Date() },
    });

    return jsonOk(serializePengguna(updated) as Record<string, unknown>);
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return jsonError("Gagal masuk", 500);
  }
}
