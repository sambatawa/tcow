import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationKode } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const no_kode = typeof body.no_kode === "string" ? body.no_kode : "";

    if (!no_kode.trim()) {
      return NextResponse.json(
        { error: "No kode wajib diisi" },
        { status: 400 }
      );
    }

    if (!process.env.REGISTRATION_KODE) {
      console.error("[POST /api/auth/verify-kode] REGISTRATION_KODE tidak diset");
      return NextResponse.json(
        { error: "Konfigurasi server tidak lengkap" },
        { status: 500 }
      );
    }

    if (!verifyRegistrationKode(no_kode)) {
      return NextResponse.json(
        { error: "No kode tidak valid atau tidak terdaftar" },
        { status: 403 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[POST /api/auth/verify-kode]", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi kode" },
      { status: 500 }
    );
  }
}
