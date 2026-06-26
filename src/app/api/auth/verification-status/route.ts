import { NextRequest, NextResponse } from "next/server";
import {
  buildVerificationStatus,
  findVerificationRecord,
  refreshVerificationCycle,
} from "@/lib/verification-service";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const record = await findVerificationRecord(email);
    if (!record) {
      return NextResponse.json(
        { error: "Tidak ada permintaan verifikasi. Silakan daftar ulang." },
        { status: 404 }
      );
    }

    const refreshed = await refreshVerificationCycle(record);
    return NextResponse.json(buildVerificationStatus(refreshed));
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat status verifikasi" },
      { status: 500 }
    );
  }
}
