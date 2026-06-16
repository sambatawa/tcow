import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  formatRelativeTime,
  healthToAlertType,
  getChartColor,
  type DashboardData,
  type DashboardCattleRow,
} from "@/lib/dashboard";

export async function GET() {
  try {
    // 1. Ambil data secara paralel menggunakan nama model huruf kecil sesuai schema.prisma
    const [sapiList, riwayatMedisList, informasiFisikList, riwayatReproduksiList] = await Promise.all([
      prisma.sapi.findMany({
        orderBy: { idsapi: "asc" },
      }),
      prisma.riwayatmedis.findMany({
        orderBy: { tanggal_medis: "desc" },
      }),
      prisma.informasi_fisik.findMany({
        orderBy: { tanggal_timbang: "asc" },
      }),
      prisma.riwayatreproduksi.findMany({
        orderBy: { tanggal_ib: "desc" },
      }),
    ]);

    // Map untuk mencari berat badan (bb_akhir) terbaru berdasarkan idsapi
    const latestFisik = new Map<number, (typeof informasiFisikList)[number]>();
    for (const row of informasiFisikList) {
      latestFisik.set(row.idsapi, row);
    }

    // Map untuk mencari riwayat reproduksi terakhir berdasarkan idsapi
    const latestRepro = new Map<number, (typeof riwayatReproduksiList)[number]>();
    for (const row of riwayatReproduksiList) {
      if (!latestRepro.has(row.idsapi)) {
        latestRepro.set(row.idsapi, row);
      }
    }

    // Map untuk mencari data nama sapi berdasarkan idsapi (karena di skema tidak ada relasi include)
    const sapiMap = new Map<number, (typeof sapiList)[number]>();
    for (const s of sapiList) {
      sapiMap.set(s.idsapi, s);
    }

    let healthy = 0;
    let sick = 0;
    let dead = 0;

    // 2. Pemetaan baris data tabel sapi dashboard
    const cattle: DashboardCattleRow[] = sapiList.map((s) => {
      const fisik = latestFisik.get(s.idsapi);
      const repro = latestRepro.get(s.idsapi);
      const status = s.status_hidup; // Mengambil dari enum sapi_status_hidup (Sehat, Sakit, Mati)

      if (status === "Sehat") healthy++;
      else if (status === "Sakit") sick++;
      else if (status === "Mati") dead++;

      return {
        idsapi: s.idsapi,
        jenis_sapi: s.jenis_sapi,
        jenis_kelamin: s.jenis_kelamin,
        status_hidup: status,
        reproduksi: repro
          ? {
              tanggal_ib: repro.tanggal_ib,
              nama_pejantan: repro.nama_pejantan,
              keterangan: repro.keterangan,
            }
          : null,
        bb_akhir: fisik ? fisik.berat_badan : null,
        periksaUpdate: s.statusUpdate 
          ? s.statusUpdate.toISOString() 
          : s.sapiUpdate.toISOString(),
      };
    });

    // 3. Kalkulasi rata-rata berat badan dari informasi_fisik
    const weights = informasiFisikList.map((f) => f.berat_badan);
    const avgWeight =
      weights.length > 0
        ? parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1))
        : null;

    // 4. Struktur data grafik lingkaran komposisi sapi
    const chartSapi = sapiList.map((s, i) => ({
      key: String(s.idsapi),
      label: s.nama_sapi || `Sapi ID ${s.idsapi}`,
      color: getChartColor(i),
    }));

    // 5. Struktur data grafik pertumbuhan berat badan (informasi_fisik)
    const chartBuckets = new Map<string, Record<string, string | number>>();
    for (const f of informasiFisikList) {
      const d = f.tanggal_timbang;
      const label = d.toLocaleString("id-ID", {
        day: "numeric",
        month: "numeric",
      });
      if (!chartBuckets.has(label)) {
        chartBuckets.set(label, { label });
      }
      const bucket = chartBuckets.get(label)!;
      bucket[String(f.idsapi)] = f.berat_badan;
    }
    const produksiChart = Array.from(chartBuckets.values()).slice(-12);

    // 6. Alert log penanganan medis kritikal
    const alerts = riwayatMedisList
      .map((m) => {
        const terkaitSapi = sapiMap.get(m.idsapi);
        return {
          ...m,
          sapi: terkaitSapi,
        };
      })
      // Memfilter alert hanya untuk sapi yang status_hidup-nya Sakit atau Mati
      .filter((m) => m.sapi && m.sapi.status_hidup !== "Sehat")
      .slice(0, 8)
      .map((m) => ({
        id: String(m.id_medis),
        type: healthToAlertType(m.sapi!.status_hidup),
        title: `${m.sapi!.nama_sapi} — ${m.sapi!.status_hidup}`,
        message: `${m.catatan || "Menerima tindakan medis"} (${m.jenis_tindakan.replace("_", " ")})`,
        time: formatRelativeTime(m.tanggal_medis),
        read: false,
      }));

    if (alerts.length === 0 && sapiList.length > 0) {
      alerts.push({
        id: "ok",
        type: "success",
        title: "Semua sapi sehat",
        message: "Tidak ada alert penanganan medis kritikal saat ini.",
        time: "Hari ini",
        read: true,
      });
    }

    // 7. Satukan data berdasarkan tipe DashboardData kustom kita
    const data: DashboardData = {
      stats: {
        totalSapi: sapiList.length,
        healthy,
        sick,
        dead,
        totalFisik: informasiFisikList.length,
        avgWeight,
      },
      cattle,
      produksiChart,
      chartSapi,
      alerts,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard" },
      { status: 500 }
    );
  }
}