import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { idsapiToCattleId } from "@/lib/sapi";
import type { MaintenanceRow } from "@/lib/sapi-service";

export async function GET() {
  try {
    let rows: MaintenanceRow[] = [];
    try {
      rows = await prisma.$queryRaw<MaintenanceRow[]>`
        SELECT idmaintenance, idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate
        FROM maintenance
        ORDER BY maintenanceUpdate DESC
      `;
    } catch {
      rows = [];
    }

    const teknisiUids = [...new Set(rows.map((m) => m.teknisi_uid))];
    const teknisiList =
      teknisiUids.length > 0
        ? await prisma.pengguna.findMany({
            where: { uid: { in: teknisiUids } },
            select: { uid: true, name: true },
          })
        : [];
    const teknisiMap = new Map(teknisiList.map((t) => [t.uid, t.name]));

    const maintenanceData = rows.map((m) => ({
      id: `MT${String(m.idmaintenance).padStart(3, "0")}`,
      sensorId: idsapiToCattleId(m.idsapi),
      date: new Date(m.maintenanceUpdate).toISOString().split("T")[0],
      type: m.jenis_tindakan,
      description: m.Keterangan?.trim() || "—",
      technician: teknisiMap.get(m.teknisi_uid) ?? m.teknisi_uid,
      status:
        m.kondisi_alat === "Normal"
          ? "Selesai"
          : m.kondisi_alat === "Perbaikan"
            ? "Dalam Proses"
            : "Menunggu",
      priority:
        m.kondisi_alat === "Rusak"
          ? "Tinggi"
          : m.kondisi_alat === "Perbaikan"
            ? "Sedang"
            : "Rendah",
    }));

    return NextResponse.json({ maintenanceData });
  } catch (error) {
    console.error("[GET /api/maintenance]", error);
    return NextResponse.json(
      { error: "Gagal memuat data maintenance" },
      { status: 500 }
    );
  }
}
