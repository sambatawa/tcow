import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp, parsePayload } from "@/lib/otp";
import { generateUid } from "@/lib/pengguna";
import { isCodeExpired } from "@/lib/verification-policy";
import {
  findVerificationRecord,
  refreshVerificationCycle,
} from "@/lib/verification-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body as { email: string; code: string };

    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Email dan kode wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().replace(/\s/g, "");

    if (!/^\d{6}$/.test(normalizedCode)) {
      return NextResponse.json(
        { error: "Kode harus 6 digit angka" },
        { status: 400 }
      );
    }

    const found = await findVerificationRecord(normalizedEmail);
    if (!found) {
      return NextResponse.json(
        { error: "Tidak ada permintaan verifikasi. Daftar ulang." },
        { status: 404 }
      );
    }

    const record = await refreshVerificationCycle(found);

    if (record.lockedUntil && record.lockedUntil > new Date()) {
      return NextResponse.json(
        {
          error:
            "Verifikasi dikunci sementara karena terlalu banyak permintaan kode. Coba lagi nanti.",
        },
        { status: 423 }
      );
    }

    if (isCodeExpired(record.expiresAt)) {
      return NextResponse.json(
        {
          error:
            "Kode sudah kedaluwarsa (60 detik). Minta kode baru dengan tombol kirim ulang.",
          codeExpired: true,
        },
        { status: 410 }
      );
    }

    const valid = await verifyOtp(normalizedCode, record.codeHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Kode verifikasi salah" },
        { status: 403 }
      );
    }

    const payload = parsePayload(record.payload);
    if (!payload) {
      return NextResponse.json(
        { error: "Data pendaftaran tidak valid" },
        { status: 500 }
      );
    }

    const existing = await prisma.pengguna.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      await prisma.verifikasi_email.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const uid = await generateUid("Peternak");

    await prisma.pengguna.create({
      data: {
        uid,
        no_kode: payload.no_kode,
        name: payload.name,
        email: normalizedEmail,
        password: payload.passwordHash,
        role: "Peternak",
        alamat: payload.alamat?.trim() || null,
        image: null,
        firebase_uid: null,
      },
    });

    await prisma.verifikasi_email.delete({ where: { id: record.id } });

    return NextResponse.json({
      success: true,
      message: "Email terverifikasi. Silakan masuk.",
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memverifikasi kode" },
      { status: 500 }
    );
  }
}
