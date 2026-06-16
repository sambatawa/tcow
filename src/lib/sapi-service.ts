import prisma from "@/lib/prisma";
import { calcAgeYears, idsapiToCattleId,parseCattleId, type CattleActivity, type CattleListItem, type MedicalRecord,
  type SapiBundle, type VaccinationRecord} from "@/lib/sapi";

export type MaintenanceRow = {
  idmaintenance: number;
  idsapi: number;
  teknisi_uid: string;
  jenis_tindakan: string;
  kondisi_alat: string;
  Keterangan: string | null;
  maintenanceUpdate: Date;
};

async function loadMaintenanceList(): Promise<MaintenanceRow[]> {
  try {
    const rows = await prisma.$queryRaw<MaintenanceRow[]>`
      SELECT idmaintenance, idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate
      FROM maintenance
      ORDER BY maintenanceUpdate DESC
    `;
    return rows.map((r) => ({
      ...r,
      maintenanceUpdate: new Date(r.maintenanceUpdate),
    }));
  } catch {
    return [];
  }
}

export async function buildSapiBundle(): Promise<SapiBundle> {
  const [sapiList, riwayatMedisList, riwayatReproduksiList, maintenanceList, informasiFisikList] =
    await Promise.all([
      prisma.sapi.findMany({ orderBy: { idsapi: "asc" } }),
      prisma.riwayatmedis.findMany({
        orderBy: { tanggal_medis: "desc" },
      }),
      prisma.riwayatreproduksi.findMany({
        orderBy: { tanggal_ib: "desc" },
      }),
      loadMaintenanceList(),
      prisma.informasi_fisik.findMany({
        orderBy: { tanggal_timbang: "desc" },
      }),
    ]);

  const latestRiwayatMedis = new Map<number, (typeof riwayatMedisList)[number]>();
  for (const row of riwayatMedisList) {
    if (!latestRiwayatMedis.has(row.idsapi)) {
      latestRiwayatMedis.set(row.idsapi, row);
    }
  }

  const latestInformasiFisik = new Map<number, (typeof informasiFisikList)[number]>();
  for (const row of informasiFisikList) {
    if (!latestInformasiFisik.has(row.idsapi)) {
      latestInformasiFisik.set(row.idsapi, row);
    }
  }

  const cattle: CattleListItem[] = sapiList.map((s) => {
    const m = latestRiwayatMedis.get(s.idsapi);
    const f = latestInformasiFisik.get(s.idsapi);
    const cattleId = idsapiToCattleId(s.idsapi);
    return {
      id: cattleId,
      idsapi: s.idsapi,
      name: s.nama_sapi,
      breed: s.jenis_sapi,
      age: calcAgeYears(s.tanggal_lahir),
      weight: f?.berat_badan ?? 0,
      status: s.kandang,
      health: s.status_hidup,
      stall: `Kandang ${cattleId}`,
      kandangKategori: s.kandang,
      birthDate: s.tanggal_lahir.toISOString().split("T")[0],
      milkAvg: f?.berat_badan ? Math.round(f.berat_badan * 0.05 * 10) / 10 : 0,
      lastCheck: (m?.tanggal_medis ?? s.tanggal_lahir)
        .toISOString()
        .split("T")[0],
    };
  });

  const medicalHistory: MedicalRecord[] = riwayatMedisList.map((m) => ({
    id: `M${m.id_medis}`,
    cattleId: idsapiToCattleId(m.idsapi),
    date: m.tanggal_medis.toISOString().split("T")[0],
    type: "Pemeriksaan Medis",
    description: `${m.jenis_tindakan} — ${m.catatan || "Tidak ada catatan"}`,
    vet: "Tim Kesehatan",
    status: "Selesai",
  }));

  const vaccinationData: VaccinationRecord[] = maintenanceList
    .filter((m) => /vaksin/i.test(m.jenis_tindakan))
    .map((m) => ({
      id: `V${m.idmaintenance}`,
      cattleId: idsapiToCattleId(m.idsapi),
      vaccine: m.jenis_tindakan,
      date: new Date(m.maintenanceUpdate).toISOString().split("T")[0],
      nextDue: new Date(
        new Date(m.maintenanceUpdate).getTime() + 180 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      status:
        m.kondisi_alat === "Normal"
          ? "Selesai"
          : m.kondisi_alat === "Perbaikan"
            ? "Terjadwal"
            : "Terlambat",
      vet: m.teknisi_uid,
      batch: `MT-${m.idmaintenance}`,
    }));

  const cattleActivityLog: CattleActivity[] = [
    ...riwayatMedisList.map((m) => ({
      id: `A-M${m.id_medis}`,
      cattleId: idsapiToCattleId(m.idsapi),
      date: m.tanggal_medis.toISOString().split("T")[0],
      type: "Pemeriksaan Medis",
      detail: `${m.jenis_tindakan} — ${m.catatan || "Tidak ada catatan"}`,
      petugas: "Tim Kesehatan",
      kategori: "pemeriksaan",
    })),
    ...informasiFisikList.map((f) => ({
      id: `A-F${f.idfisik}`,
      cattleId: idsapiToCattleId(f.idsapi),
      date: f.tanggal_timbang.toISOString().split("T")[0],
      type: "Pencatatan Bobot",
      detail: `Bobot ${f.berat_badan} kg`,
      petugas: "Sistem Produksi",
      kategori: "pemeriksaan",
    })),
    ...maintenanceList.map((m) => ({
      id: `A-Maint${m.idmaintenance}`,
      cattleId: idsapiToCattleId(m.idsapi),
      date: new Date(m.maintenanceUpdate).toISOString().split("T")[0],
      type: m.jenis_tindakan,
      detail: m.Keterangan?.trim() || `Kondisi alat: ${m.kondisi_alat}`,
      petugas: m.teknisi_uid,
      kategori: /vaksin/i.test(m.jenis_tindakan)
        ? "vaksinasi"
        : "perawatan",
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { cattle, medicalHistory, vaccinationData, cattleActivityLog };
}

export async function findCattleByParam(idParam: string) {
  const bundle = await buildSapiBundle();
  const idsapi = parseCattleId(idParam);
  const byNum =
    idsapi !== null
      ? bundle.cattle.find((c) => c.idsapi === idsapi)
      : null;
  const cattle =
    byNum ?? bundle.cattle.find((c) => c.id === idParam) ?? null;
  return { cattle, bundle };
}
