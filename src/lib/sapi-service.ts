import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  calcAgeYears,
  idsapiToCattleId,
  parseCattleId,
  type ActivityInput,
  type CattleActivity,
  type CattleInput,
  type CattleListItem,
  type MedicalRecord,
  type MedicalRecordInput,
  type SapiBundle,
  type VaccinationRecord,
  type LastVaccinationDates,
} from "@/lib/sapi";

type RiwayatmedisJenisTindakan = "Obat_Cacing" | "Vaksin_PMK" | "Vaksin_LSD";
type SapiJenisKelamin = "Jantan" | "Betina";
type SapiKandang = "Individu" | "KandangDara" | "KoloniBesar";
type SapiStatusHidup = "Sehat" | "Sakit" | "Mati";

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
    return rows.map((r: MaintenanceRow) => ({
      ...r,
      maintenanceUpdate: new Date(r.maintenanceUpdate),
    }));
  } catch {
    return [];
  }
}

function mapRiwayatMedisRow(m: {
  id_medis: number;
  idsapi: number;
  jenis_tindakan: RiwayatmedisJenisTindakan;
  tanggal_medis: Date;
  catatan: string | null;
}): MedicalRecord {
  const vet = "Tim Kesehatan";
  const catatan = m.catatan?.trim() ?? "";
  return {
    id: `M${m.id_medis}`,
    cattleId: idsapiToCattleId(m.idsapi),
    date: m.tanggal_medis.toISOString().split("T")[0],
    type: "Pemeriksaan Medis",
    description: `${m.jenis_tindakan.replace(/_/g, " ")}${catatan ? ` — ${catatan}` : ""}`,
    vet,
    status: "Selesai",
    jenisTindakan: m.jenis_tindakan,
    catatan,
  };
}

function mapMedisActivity(m: {
  id_medis: number;
  idsapi: number;
  jenis_tindakan: RiwayatmedisJenisTindakan;
  tanggal_medis: Date;
  catatan: string | null;
}): CattleActivity {
  const catatan = m.catatan?.trim() ?? "";
  return {
    id: `A-M${m.id_medis}`,
    cattleId: idsapiToCattleId(m.idsapi),
    date: m.tanggal_medis.toISOString().split("T")[0],
    type: "Pemeriksaan Medis",
    detail: `${m.jenis_tindakan.replace(/_/g, " ")}${catatan ? ` — ${catatan}` : ""}`,
    petugas: "Tim Kesehatan",
    kategori: "pemeriksaan",
    source: "medis",
    sourceId: m.id_medis,
    jenisTindakan: m.jenis_tindakan,
  };
}

function mapFisikActivity(f: {
  idfisik: number;
  idsapi: number;
  berat_badan: number;
  tanggal_timbang: Date;
}): CattleActivity {
  return {
    id: `A-F${f.idfisik}`,
    cattleId: idsapiToCattleId(f.idsapi),
    date: f.tanggal_timbang.toISOString().split("T")[0],
    type: "Pencatatan Bobot",
    detail: `Bobot ${f.berat_badan} kg`,
    petugas: "Sistem Produksi",
    kategori: "pencatatan_bobot",
    source: "fisik",
    sourceId: f.idfisik,
    beratBadan: f.berat_badan,
  };
}

function mapMaintenanceActivity(m: MaintenanceRow): CattleActivity {
  return {
    id: `A-Maint${m.idmaintenance}`,
    cattleId: idsapiToCattleId(m.idsapi),
    date: new Date(m.maintenanceUpdate).toISOString().split("T")[0],
    type: m.jenis_tindakan,
    detail: m.Keterangan?.trim() || `Kondisi alat: ${m.kondisi_alat}`,
    petugas: m.teknisi_uid,
    kategori: /vaksin/i.test(m.jenis_tindakan) ? "vaksinasi" : "perawatan",
    source: "maintenance",
    sourceId: m.idmaintenance,
  };
}

export function parseMedicalRecordId(id: string): number | null {
  const match = /^M?(\d+)$/.exec(id.trim());
  return match ? parseInt(match[1], 10) : null;
}

export function parseActivityId(
  id: string
): { source: CattleActivity["source"]; sourceId: number } | null {
  const medis = /^A-M(\d+)$/.exec(id);
  if (medis) return { source: "medis", sourceId: parseInt(medis[1], 10) };

  const fisik = /^A-F(\d+)$/.exec(id);
  if (fisik) return { source: "fisik", sourceId: parseInt(fisik[1], 10) };

  const maintenance = /^A-Maint(\d+)$/.exec(id);
  if (maintenance) {
    return { source: "maintenance", sourceId: parseInt(maintenance[1], 10) };
  }

  return null;
}

function resolveIdsapi(idParam: string): number | null {
  return parseCattleId(idParam);
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

  void riwayatReproduksiList; 

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

  const cattle: CattleListItem[] = sapiList.map((s: Prisma.sapiGetPayload<object>) => {
    const m = latestRiwayatMedis.get(s.idsapi);
    const f = latestInformasiFisik.get(s.idsapi);
    const cattleId = idsapiToCattleId(s.idsapi);
    return {
      id: cattleId,
      idsapi: s.idsapi,
      name: s.nama_sapi,
      breed: s.jenis_sapi,
      gender: s.jenis_kelamin,
      age: calcAgeYears(s.tanggal_lahir),
      weight: f?.berat_badan ?? 0,
      status: s.kandang,
      health: s.status_hidup as SapiStatusHidup,
      stall: `Kandang ${cattleId}`,
      kandangKategori: s.kandang as SapiKandang,
      birthDate: s.tanggal_lahir.toISOString().split("T")[0],
      eartag: s.nomor_eartag,
      namaEartag: s.nama_eartag,
      milkAvg: f?.berat_badan ? Math.round(f.berat_badan * 0.05 * 10) / 10 : 0,
      lastCheck: (m?.tanggal_medis ?? s.tanggal_lahir)
        .toISOString()
        .split("T")[0],
    };
  });

  const medicalHistory: MedicalRecord[] = riwayatMedisList.map(mapRiwayatMedisRow);

  const vaccinationData: VaccinationRecord[] = maintenanceList
    .filter((m: MaintenanceRow) => /vaksin/i.test(m.jenis_tindakan))
    .map((m: MaintenanceRow) => ({
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
    ...riwayatMedisList.map(mapMedisActivity),
    ...informasiFisikList.map(mapFisikActivity),
    ...maintenanceList.map(mapMaintenanceActivity),
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

export async function getLastVaccinationDates(
  idsapi: number
): Promise<LastVaccinationDates> {
  const types: RiwayatmedisJenisTindakan[] = [
    "Obat_Cacing",
    "Vaksin_PMK",
    "Vaksin_LSD",
  ];

  const records = await Promise.all(
    types.map((jenis_tindakan) =>
      prisma.riwayatmedis.findFirst({
        where: { idsapi, jenis_tindakan },
        orderBy: { tanggal_medis: "desc" },
        select: { tanggal_medis: true },
      })
    )
  );

  const toDateStr = (date: Date | undefined) =>
    date ? date.toISOString().split("T")[0] : null;

  return {
    obatCacing: toDateStr(records[0]?.tanggal_medis),
    vaksinPmk: toDateStr(records[1]?.tanggal_medis),
    vaksinLsd: toDateStr(records[2]?.tanggal_medis),
  };
}

export async function findCattleByNamaEartag(
  namaEartag: string
): Promise<CattleListItem | null> {
  const code = namaEartag.trim();
  if (!code) return null;

  const sapi = await prisma.sapi.findFirst({
    where: { nama_eartag: code },
  });
  if (!sapi) return null;

  const [latestMedis, latestFisik] = await Promise.all([
    prisma.riwayatmedis.findFirst({
      where: { idsapi: sapi.idsapi },
      orderBy: { tanggal_medis: "desc" },
    }),
    prisma.informasi_fisik.findFirst({
      where: { idsapi: sapi.idsapi },
      orderBy: { tanggal_timbang: "desc" },
    }),
  ]);

  const cattleId = idsapiToCattleId(sapi.idsapi);
  return {
    id: cattleId,
    idsapi: sapi.idsapi,
    name: sapi.nama_sapi,
    breed: sapi.jenis_sapi,
    gender: sapi.jenis_kelamin,
    age: calcAgeYears(sapi.tanggal_lahir),
    weight: latestFisik?.berat_badan ?? 0,
    status: sapi.kandang,
    health: sapi.status_hidup as SapiStatusHidup,
    stall: `Kandang ${cattleId}`,
    kandangKategori: sapi.kandang as SapiKandang,
    birthDate: sapi.tanggal_lahir.toISOString().split("T")[0],
    eartag: sapi.nomor_eartag,
    namaEartag: sapi.nama_eartag,
    milkAvg: latestFisik?.berat_badan
      ? Math.round(latestFisik.berat_badan * 0.05 * 10) / 10
      : 0,
    lastCheck: (latestMedis?.tanggal_medis ?? sapi.tanggal_lahir)
      .toISOString()
      .split("T")[0],
  };
}

function parseDateInput(value: string | undefined, fallback = new Date()): Date {
  if (!value?.trim()) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function createCattle(input: CattleInput): Promise<CattleListItem> {
  const name = input.name.trim();
  const breed = input.breed.trim();
  if (!name || !breed) {
    throw new Error("Nama dan jenis sapi wajib diisi");
  }

  const created = await prisma.$transaction(async (tx: any) => {
    const sapi = await tx.sapi.create({
      data: {
        nama_sapi: name,
        jenis_sapi: breed,
        jenis_kelamin: (input.gender ?? "Betina") as SapiJenisKelamin,
        kandang: (input.kandang ?? "KoloniBesar") as SapiKandang,
        tanggal_lahir: parseDateInput(input.birthDate),
        status_hidup: (input.health ?? "Sehat") as SapiStatusHidup,
        ...(input.eartag?.trim() ? { nomor_eartag: input.eartag.trim() } : {}),
      },
    });

    if (input.weight !== undefined && input.weight > 0) {
      await tx.informasi_fisik.create({
        data: {
          idsapi: sapi.idsapi,
          berat_badan: input.weight,
          tanggal_timbang: parseDateInput(input.lastCheck),
        },
      });
    }

    if (input.lastCheck?.trim()) {
      await tx.riwayatmedis.create({
        data: {
          idsapi: sapi.idsapi,
          jenis_tindakan: "Obat_Cacing" as RiwayatmedisJenisTindakan,
          tanggal_medis: parseDateInput(input.lastCheck),
          catatan: "Pemeriksaan rutin",
        },
      });
    }

    return sapi;
  });

  const { cattle } = await findCattleByParam(idsapiToCattleId(created.idsapi));
  if (!cattle) throw new Error("Gagal memuat data sapi baru");
  return cattle;
}

export async function updateCattle(
  idParam: string,
  input: Partial<CattleInput>
): Promise<CattleListItem | null> {
  const idsapi = parseCattleId(idParam);
  if (idsapi === null) return null;

  const existing = await prisma.sapi.findUnique({ where: { idsapi } });
  if (!existing) return null;

  await prisma.$transaction(async (tx: any) => {
    await tx.sapi.update({
      where: { idsapi },
      data: {
        ...(input.name !== undefined && { nama_sapi: input.name.trim() }),
        ...(input.breed !== undefined && { jenis_sapi: input.breed.trim() }),
        ...(input.gender !== undefined && {
          jenis_kelamin: input.gender as SapiJenisKelamin,
        }),
        ...(input.kandang !== undefined && {
          kandang: input.kandang as SapiKandang,
        }),
        ...(input.birthDate !== undefined && {
          tanggal_lahir: parseDateInput(input.birthDate),
        }),
        ...(input.health !== undefined && {
          status_hidup: input.health as SapiStatusHidup,
        }),
        ...(input.eartag !== undefined && {
          nomor_eartag: input.eartag.trim() || null,
        }),
        sapiUpdate: new Date(),
      },
    });

    if (input.weight !== undefined && input.weight > 0) {
      await tx.informasi_fisik.create({
        data: {
          idsapi,
          berat_badan: input.weight,
          tanggal_timbang: new Date(),
        },
      });
    }

    if (input.lastCheck?.trim()) {
      await tx.riwayatmedis.create({
        data: {
          idsapi,
          jenis_tindakan: "Obat_Cacing" as RiwayatmedisJenisTindakan,
          tanggal_medis: parseDateInput(input.lastCheck),
          catatan: "Pembaruan data sapi",
        },
      });
    }
  });

  const { cattle } = await findCattleByParam(idParam);
  return cattle;
}

export async function deleteCattle(idParam: string): Promise<boolean> {
  const idsapi = parseCattleId(idParam);
  if (idsapi === null) return false;

  const existing = await prisma.sapi.findUnique({ where: { idsapi } });
  if (!existing) return false;

  await prisma.$transaction(async (tx: any) => {
    await tx.informasi_fisik.deleteMany({ where: { idsapi } });
    await tx.riwayatmedis.deleteMany({ where: { idsapi } });
    await tx.riwayatreproduksi.deleteMany({ where: { idsapi } });
    await tx.maintenance.deleteMany({ where: { idsapi } });
    await tx.sapi.delete({ where: { idsapi } });
  });

  return true;
}

export async function listMedicalRecordsForCattle(
  idParam: string
): Promise<MedicalRecord[]> {
  const idsapi = resolveIdsapi(idParam);
  if (idsapi === null) return [];

  const rows = await prisma.riwayatmedis.findMany({
    where: { idsapi },
    orderBy: { tanggal_medis: "desc" },
  });

  return rows.map(mapRiwayatMedisRow);
}

export async function createMedicalRecord(
  idParam: string,
  input: MedicalRecordInput
): Promise<MedicalRecord | null> {
  const idsapi = resolveIdsapi(idParam);
  if (idsapi === null) return null;

  const sapi = await prisma.sapi.findUnique({ where: { idsapi } });
  if (!sapi) return null;

  const created = await prisma.riwayatmedis.create({
    data: {
      idsapi,
      jenis_tindakan: input.jenisTindakan as RiwayatmedisJenisTindakan,
      tanggal_medis: parseDateInput(input.date),
      catatan: input.catatan?.trim() || null,
    },
  });

  return mapRiwayatMedisRow(created);
}

export async function updateMedicalRecord(
  idParam: string,
  recordId: string,
  input: Partial<MedicalRecordInput>
): Promise<MedicalRecord | null> {
  const idsapi = resolveIdsapi(idParam);
  const idMedis = parseMedicalRecordId(recordId);
  if (idsapi === null || idMedis === null) return null;

  const existing = await prisma.riwayatmedis.findFirst({
    where: { id_medis: idMedis, idsapi },
  });
  if (!existing) return null;

  const updated = await prisma.riwayatmedis.update({
    where: { id_medis: idMedis },
    data: {
      ...(input.jenisTindakan !== undefined && {
        jenis_tindakan: input.jenisTindakan as RiwayatmedisJenisTindakan,
      }),
      ...(input.date !== undefined && {
        tanggal_medis: parseDateInput(input.date),
      }),
      ...(input.catatan !== undefined && {
        catatan: input.catatan.trim() || null,
      }),
    },
  });

  return mapRiwayatMedisRow(updated);
}

export async function deleteMedicalRecord(
  idParam: string,
  recordId: string
): Promise<boolean> {
  const idsapi = resolveIdsapi(idParam);
  const idMedis = parseMedicalRecordId(recordId);
  if (idsapi === null || idMedis === null) return false;

  const existing = await prisma.riwayatmedis.findFirst({
    where: { id_medis: idMedis, idsapi },
  });
  if (!existing) return false;

  await prisma.riwayatmedis.delete({ where: { id_medis: idMedis } });
  return true;
}

export async function listActivitiesForCattle(
  idParam: string
): Promise<CattleActivity[]> {
  const idsapi = resolveIdsapi(idParam);
  if (idsapi === null) return [];

  const [medisRows, fisikRows, maintenanceRows] = await Promise.all([
    prisma.riwayatmedis.findMany({
      where: { idsapi },
      orderBy: { tanggal_medis: "desc" },
    }),
    prisma.informasi_fisik.findMany({
      where: { idsapi },
      orderBy: { tanggal_timbang: "desc" },
    }),
    prisma.$queryRaw<MaintenanceRow[]>`
      SELECT idmaintenance, idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate
      FROM maintenance
      WHERE idsapi = ${idsapi}
      ORDER BY maintenanceUpdate DESC
    `.then((rows: MaintenanceRow[]) =>
      rows.map((row: MaintenanceRow) => ({
        ...row,
        maintenanceUpdate: new Date(row.maintenanceUpdate),
      }))
    ),
  ]);

  return [
    ...medisRows.map(mapMedisActivity),
    ...fisikRows.map(mapFisikActivity),
    ...maintenanceRows.map(mapMaintenanceActivity),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createActivity(
  idParam: string,
  input: ActivityInput
): Promise<CattleActivity | null> {
  const idsapi = resolveIdsapi(idParam);
  if (idsapi === null) return null;

  const sapi = await prisma.sapi.findUnique({ where: { idsapi } });
  if (!sapi) return null;

  const petugas = input.petugas?.trim() || "Tim Peternakan";
  const date = parseDateInput(input.date);

  if (input.kategori === "pemeriksaan") {
    const created = await prisma.riwayatmedis.create({
      data: {
        idsapi,
        jenis_tindakan: (input.jenisTindakan ?? "Obat_Cacing") as RiwayatmedisJenisTindakan,
        tanggal_medis: date,
        catatan: input.detail?.trim() || input.type?.trim() || null,
      },
    });
    return mapMedisActivity(created);
  }

  if (input.kategori === "pencatatan_bobot") {
    const berat = input.beratBadan ?? 0;
    if (berat <= 0) throw new Error("Berat badan wajib diisi untuk pencatatan bobot");

    const created = await prisma.informasi_fisik.create({
      data: {
        idsapi,
        berat_badan: berat,
        tanggal_timbang: date,
      },
    });
    return mapFisikActivity(created);
  }

  const jenisTindakan =
    input.type?.trim() ||
    (input.kategori === "vaksinasi" ? "Vaksinasi" : "Perawatan Rutin");

  await prisma.$executeRaw`
    INSERT INTO maintenance (idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate)
    VALUES (${idsapi}, ${petugas.slice(0, 10)}, ${jenisTindakan}, ${"Normal"}, ${input.detail?.trim() || null}, ${date})
  `;

  const rows = await prisma.$queryRaw<MaintenanceRow[]>`
    SELECT idmaintenance, idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate
    FROM maintenance
    WHERE idsapi = ${idsapi}
    ORDER BY idmaintenance DESC
    LIMIT 1
  `;

  const created = rows[0];
  if (!created) return null;

  return mapMaintenanceActivity({
    ...created,
    maintenanceUpdate: new Date(created.maintenanceUpdate),
  });
}

export async function updateActivity(
  idParam: string,
  activityId: string,
  input: Partial<ActivityInput>
): Promise<CattleActivity | null> {
  const idsapi = resolveIdsapi(idParam);
  const parsed = parseActivityId(activityId);
  if (idsapi === null || parsed === null) return null;

  const date = input.date ? parseDateInput(input.date) : undefined;

  if (parsed.source === "medis") {
    const existing = await prisma.riwayatmedis.findFirst({
      where: { id_medis: parsed.sourceId, idsapi },
    });
    if (!existing) return null;

    const updated = await prisma.riwayatmedis.update({
      where: { id_medis: parsed.sourceId },
      data: {
        ...(input.jenisTindakan !== undefined && {
          jenis_tindakan: input.jenisTindakan as RiwayatmedisJenisTindakan,
        }),
        ...(date !== undefined && { tanggal_medis: date }),
        ...(input.detail !== undefined && {
          catatan: input.detail.trim() || null,
        }),
      },
    });
    return mapMedisActivity(updated);
  }

  if (parsed.source === "fisik") {
    const existing = await prisma.informasi_fisik.findFirst({
      where: { idfisik: parsed.sourceId, idsapi },
    });
    if (!existing) return null;

    const updated = await prisma.informasi_fisik.update({
      where: { idfisik: parsed.sourceId },
      data: {
        ...(date !== undefined && { tanggal_timbang: date }),
        ...(input.beratBadan !== undefined && { berat_badan: input.beratBadan }),
      },
    });
    return mapFisikActivity(updated);
  }

  const existingRows = await prisma.$queryRaw<MaintenanceRow[]>`
    SELECT idmaintenance, idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate
    FROM maintenance
    WHERE idmaintenance = ${parsed.sourceId} AND idsapi = ${idsapi}
    LIMIT 1
  `;
  if (!existingRows[0]) return null;

  const petugas = input.petugas?.trim();
  const jenisTindakan = input.type?.trim();
  const keterangan = input.detail?.trim();

  await prisma.$executeRaw`
    UPDATE maintenance
    SET
      teknisi_uid = COALESCE(${petugas ? petugas.slice(0, 10) : null}, teknisi_uid),
      jenis_tindakan = COALESCE(${jenisTindakan ?? null}, jenis_tindakan),
      Keterangan = COALESCE(${keterangan ?? null}, Keterangan),
      maintenanceUpdate = COALESCE(${date ?? null}, maintenanceUpdate)
    WHERE idmaintenance = ${parsed.sourceId} AND idsapi = ${idsapi}
  `;

  const updatedRows = await prisma.$queryRaw<MaintenanceRow[]>`
    SELECT idmaintenance, idsapi, teknisi_uid, jenis_tindakan, kondisi_alat, Keterangan, maintenanceUpdate
    FROM maintenance
    WHERE idmaintenance = ${parsed.sourceId}
    LIMIT 1
  `;

  if (!updatedRows[0]) return null;

  return mapMaintenanceActivity({
    ...updatedRows[0],
    maintenanceUpdate: new Date(updatedRows[0].maintenanceUpdate),
  });
}

export async function deleteActivity(
  idParam: string,
  activityId: string
): Promise<boolean> {
  const idsapi = resolveIdsapi(idParam);
  const parsed = parseActivityId(activityId);
  if (idsapi === null || parsed === null) return false;

  if (parsed.source === "medis") {
    const existing = await prisma.riwayatmedis.findFirst({
      where: { id_medis: parsed.sourceId, idsapi },
    });
    if (!existing) return false;
    await prisma.riwayatmedis.delete({ where: { id_medis: parsed.sourceId } });
    return true;
  }

  if (parsed.source === "fisik") {
    const existing = await prisma.informasi_fisik.findFirst({
      where: { idfisik: parsed.sourceId, idsapi },
    });
    if (!existing) return false;
    await prisma.informasi_fisik.delete({ where: { idfisik: parsed.sourceId } });
    return true;
  }

  const existingRows = await prisma.$queryRaw<{ idmaintenance: number }[]>`
    SELECT idmaintenance FROM maintenance
    WHERE idmaintenance = ${parsed.sourceId} AND idsapi = ${idsapi}
    LIMIT 1
  `;
  if (!existingRows[0]) return false;

  await prisma.$executeRaw`
    DELETE FROM maintenance WHERE idmaintenance = ${parsed.sourceId} AND idsapi = ${idsapi}
  `;
  return true;
}

export type FullExportData = {
  exportDate: string;
  summary: {
    totalSapi: number;
    totalInformasiFisik: number;
    totalRiwayatMedis: number;
    totalRiwayatReproduksi: number;
  };
  sapi: Array<{
    idsapi: number;
    nomor_eartag: string | null;
    nama_sapi: string;
    jenis_sapi: string;
    jenis_kelamin: string;
    kandang: string;
    tanggal_lahir: string;
    status_hidup: string;
    keteranganStatus: string | null;
  }>;
  informasiFisik: Array<{
    idfisik: number;
    idsapi: number;
    berat_badan: number;
    tanggal_timbang: string;
  }>;
  riwayatMedis: Array<{
    id_medis: number;
    idsapi: number;
    jenis_tindakan: string;
    tanggal_medis: string;
    catatan: string | null;
  }>;
  riwayatReproduksi: Array<{
    id_reproduksi: number;
    idsapi: number;
    tanggal_ib: string;
    nama_pejantan: string;
    keterangan: string | null;
  }>;
};

export async function buildFullExportData(): Promise<FullExportData> {
  const [sapiList, informasiFisikList, riwayatMedisList, riwayatReproduksiList] = await Promise.all([
    prisma.sapi.findMany({ orderBy: { idsapi: "asc" } }),
    prisma.informasi_fisik.findMany({ orderBy: { idsapi: "asc" } }),
    prisma.riwayatmedis.findMany({ orderBy: { idsapi: "asc" } }),
    prisma.riwayatreproduksi.findMany({ orderBy: { idsapi: "asc" } }),
  ]);

  return {
    exportDate: new Date().toISOString(),
    summary: {
      totalSapi: sapiList.length,
      totalInformasiFisik: informasiFisikList.length,
      totalRiwayatMedis: riwayatMedisList.length,
      totalRiwayatReproduksi: riwayatReproduksiList.length,
    },
    sapi: sapiList.map((s: Prisma.sapiGetPayload<object>) => ({
      idsapi: s.idsapi,
      nomor_eartag: s.nomor_eartag,
      nama_sapi: s.nama_sapi,
      jenis_sapi: s.jenis_sapi,
      jenis_kelamin: s.jenis_kelamin,
      kandang: s.kandang,
      tanggal_lahir: s.tanggal_lahir.toISOString().split("T")[0],
      status_hidup: s.status_hidup,
      keteranganStatus: s.keteranganStatus,
    })),
    informasiFisik: informasiFisikList.map((f: Prisma.informasi_fisikGetPayload<object>) => ({
      idfisik: f.idfisik,
      idsapi: f.idsapi,
      berat_badan: f.berat_badan,
      tanggal_timbang: f.tanggal_timbang.toISOString().split("T")[0],
    })),
    riwayatMedis: riwayatMedisList.map((m: Prisma.riwayatmedisGetPayload<object>) => ({
      id_medis: m.id_medis,
      idsapi: m.idsapi,
      jenis_tindakan: m.jenis_tindakan,
      tanggal_medis: m.tanggal_medis.toISOString().split("T")[0],
      catatan: m.catatan,
    })),
    riwayatReproduksi: riwayatReproduksiList.map((r: Prisma.riwayatreproduksiGetPayload<object>) => ({
      id_reproduksi: r.id_reproduksi,
      idsapi: r.idsapi,
      tanggal_ib: r.tanggal_ib.toISOString().split("T")[0],
      nama_pejantan: r.nama_pejantan,
      keterangan: r.keterangan,
    })),
  };
}
