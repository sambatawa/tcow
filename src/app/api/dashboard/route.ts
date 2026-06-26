import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  formatRelativeTime,
  healthToAlertType,
  getChartColor,
  type DashboardData,
  type DashboardCattleRow,
} from "@/lib/dashboard";
import { getAuthUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
    
    const latestFisik = new Map<number, (typeof informasiFisikList)[number]>();
    for (const row of informasiFisikList) {
      latestFisik.set(row.idsapi, row);
    }

    const latestRepro = new Map<number, (typeof riwayatReproduksiList)[number]>();
    for (const row of riwayatReproduksiList) {
      if (!latestRepro.has(row.idsapi)) {
        latestRepro.set(row.idsapi, row);
      }
    }

    const sapiMap = new Map<number, (typeof sapiList)[number]>();
    for (const s of sapiList) {
      sapiMap.set(s.idsapi, s);
    }

    let healthy = 0;
    let sick = 0;
    let dead = 0;

    const cattle: DashboardCattleRow[] = sapiList.map((s: (typeof sapiList)[number]) => {
      const fisik = latestFisik.get(s.idsapi);
      const repro = latestRepro.get(s.idsapi);
      const status = s.status_hidup;

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
    
    const weights = informasiFisikList.map((f: (typeof informasiFisikList)[number]) => f.berat_badan);    
    const avgWeight =
    weights.length > 0
      ? parseFloat((weights.reduce((a: number, b: number) => a + b, 0) / weights.length).toFixed(1))
      : null;

    const chartSapi = sapiList.map((s: (typeof sapiList)[number], i: number) => ({
      key: String(s.idsapi),
      label: s.nama_sapi || `Sapi ID ${s.idsapi}`,
      color: getChartColor(i),
    }));

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

    const mappedAlerts = riwayatMedisList.map((m: (typeof riwayatMedisList)[number]) => {
      const terkaitSapi = sapiMap.get(m.idsapi);
      return {
        ...m,
        sapi: terkaitSapi,
      };
    });

    const alerts = mappedAlerts.filter((m: (typeof mappedAlerts)[number]) => m.sapi !== undefined && m.sapi.status_hidup !== "Sehat")
      .slice(0, 8)
      .map((m: (typeof mappedAlerts)[number]) => ({
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
    return NextResponse.json(
      { error: "Gagal memuat data dashboard" },
      { status: 500 }
    );
  }
}