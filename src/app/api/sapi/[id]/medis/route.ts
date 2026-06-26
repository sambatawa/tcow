import { NextRequest, NextResponse } from "next/server";
import {
  createMedicalRecord,
  listMedicalRecordsForCattle,
} from "@/lib/sapi-service";
import type { MedicalRecordInput } from "@/lib/sapi";
import { getAuthUser } from "@/lib/auth-guard";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = getAuthUser(_request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const records = await listMedicalRecordsForCattle(id);
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat riwayat medis" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as MedicalRecordInput;

    if (!body.jenisTindakan || !body.date) {
      return NextResponse.json(
        { error: "Jenis tindakan dan tanggal wajib diisi" },
        { status: 400 }
      );
    }

    const record = await createMedicalRecord(id, body);
    if (!record) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menambahkan riwayat medis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
