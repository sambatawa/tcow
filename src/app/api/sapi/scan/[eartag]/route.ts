import { NextRequest, NextResponse } from "next/server";
import { findCattleByNamaEartag, getLastVaccinationDates } from "@/lib/sapi-service";
import type { PublicCattleScanInfo } from "@/lib/sapi";

type RouteParams = { params: Promise<{ eartag: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { eartag } = await params;
  const code = decodeURIComponent(eartag).trim();

  if (!code) {
    return NextResponse.json({ error: "Kode eartag kosong" }, { status: 400 });
  }

  try {
    const cattle = await findCattleByNamaEartag(code);
    if (!cattle) {
      return NextResponse.json(
        { error: "Eartag tidak terdaftar" },
        { status: 404 }
      );
    }

    const lastVaccinations = await getLastVaccinationDates(cattle.idsapi);

    const publicInfo: PublicCattleScanInfo = {
      id: cattle.id,
      name: cattle.name,
      breed: cattle.breed,
      gender: cattle.gender,
      age: cattle.age,
      weight: cattle.weight,
      health: cattle.health,
      stall: cattle.stall,
      kandangKategori: cattle.kandangKategori,
      birthDate: cattle.birthDate,
      lastCheck: cattle.lastCheck,
      namaEartag: cattle.namaEartag,
      lastVaccinations,
    };

    return NextResponse.json({ cattle: publicInfo });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat data sapi" },
      { status: 500 }
    );
  }
}
