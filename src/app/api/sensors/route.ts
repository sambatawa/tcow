import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchDataSensorFromRtdbDetailed, normalizeDataSensor, buildFallbackSensors} from "@/lib/firebase-rtdb";
import type { DashboardAlert } from "@/lib/dashboard";
import { sendTelegramNotification } from "@/lib/telegram";
import { shouldSendNotification } from "@/lib/ratelimit";
import { getAuthUser } from "@/lib/auth-guard";

interface SapiType {
  idsapi: number;
  nama_sapi: string;
  jenis_kelamin: string;
  kandang: string;
  nomor_eartag: string | null;
  nama_eartag: string | null;
  status_hidup: string;
}

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sapiList = await prisma.sapi.findMany({
      orderBy: { idsapi: "asc" },
      select: { idsapi: true, nama_sapi: true, jenis_kelamin: true, kandang: true, nomor_eartag: true, nama_eartag: true, status_hidup: true },
    }) as SapiType[];

    const eartagToIdsapi = new Map<string, number>();
    const cattleEartag = new Map<number, string>();
    const cattleNames = new Map<number, string>();
    const cattleKandang = new Map<number, string>();
    sapiList.forEach((s: SapiType) => {
      cattleNames.set(s.idsapi, s.nama_sapi);
      cattleKandang.set(s.idsapi, s.kandang);
      const eartag = s.nama_eartag ?? `eartag_${s.idsapi}`;
      cattleEartag.set(s.idsapi, eartag);
      if (s.nama_eartag) {
        eartagToIdsapi.set(s.nama_eartag.toLowerCase(), s.idsapi);
      }
    });
    const { data: raw, error: fetchError } = await fetchDataSensorFromRtdbDetailed();
    const { sensors: parsedSensors, tempHistory } = normalizeDataSensor( raw, cattleNames, cattleKandang, cattleEartag, eartagToIdsapi);
    const matchedCount = parsedSensors.length;
    const rtdbEmpty = parsedSensors.length === 0;
    const sensors = rtdbEmpty && sapiList.length > 0
      ? buildFallbackSensors(sapiList, cattleEartag)
      : parsedSensors;

    if (!rtdbEmpty) {
      for (const sapi of sensors as any[]) {
        if (sapi.offline) continue;

        const batasSuhuDemam = 39.5;
        const batasSuhuKritisRendah = 36.0;
        const batasBateraiLemah = 25;

        if (sapi.temperature > batasSuhuDemam) {
          if (await shouldSendNotification(sapi.cattleId, "demam")) {
            const pesanSuhuTinggi =
              `⚠️ *PERINGATAN T-COW°: SAPI DEMAM* ⚠️\n\n` +
              `🐮 *Nama Sapi:* ${sapi.cattleName}\n` +
              `🆔 *ID Eartag:* ${sapi.cattleId}\n` +
              `===== DATA KONDISI =====\n` +
              `🌡️ *Suhu Tubuh:* ${sapi.temperature}°C (⚠️ Demam Tinggi)\n` +
              `🔋 *Baterai Eartag:* ${sapi.battery}%\n` +
              `📍 *Lokasi:* ${sapi.location}\n` +
              `🕒 *Waktu Data:* ${sapi.lastUpdate}\n\n` +
              `_Mohon petugas lapangan segera mengecek kondisi kesehatan sapi._`;

            sendTelegramNotification(pesanSuhuTinggi);
          }
        }
        else if (sapi.temperature > 0 && sapi.temperature < batasSuhuKritisRendah) {
          if (await shouldSendNotification(sapi.cattleId, "suhu-rendah")) {
            const pesanSuhuRendah =
              `⚠️ *PERINGATAN T-COW°: SUHU KRITIS/ABNORMAL* ⚠️\n\n` +
              `🐮 *Nama Sapi:* ${sapi.cattleName}\n` +
              `🆔 *ID Eartag:* ${sapi.cattleId}\n` +
              `===== DATA KONDISI =====\n` +
              `🌡️ *Suhu Tubuh:* ${sapi.temperature}°C (⚠️ Terlalu Rendah)\n` +
              `🔋 *Baterai Eartag:* ${sapi.battery}%\n` +
              `📍 *Lokasi:* ${sapi.location}\n` +
              `🕒 *Waktu Data:* ${sapi.lastUpdate}\n\n` +
              `_Deteksi suhu drop di bawah normal. Harap periksa apakah alat T-Cow° terlepas dari telinga sapi._`;

            sendTelegramNotification(pesanSuhuRendah);
          }
        }

        if (sapi.battery <= batasBateraiLemah) {
          if (await shouldSendNotification(sapi.cattleId, "baterai")) {
            const pesanBaterai =
              `🔋 *PERINGATAN T-COW°: KONDISI BATERAI* ⚠️\n\n` +
              `🐮 *Nama Sapi:* ${sapi.cattleName}\n` +
              `🆔 *ID Eartag:* ${sapi.cattleId}\n` +
              `===== DATA KONDISI =====\n` +
              `🔋 *Sisa Baterai:* ${sapi.battery}% (${sapi.battery === 0 ? "⚠️ ALAT OFF / BATTERY CRITICAL" : "⚠️ Segera Cas"})\n` +
              `🌡️ *Suhu Terakhir:* ${sapi.temperature}°C\n` +
              `🕒 *Waktu Data:* ${sapi.lastUpdate}\n\n` +
              `_Mohon tim teknis segera melakukan maintenance/penggantian baterai eartag._`;

            sendTelegramNotification(pesanBaterai);
          }
        }
      }
    }

    const alerts: DashboardAlert[] = sensors
      .filter((s: any) => s.status !== "Aktif")
      .map((s: any) => ({
        id: `sensor-${s.id}`,
        type: s.status === "Error" ? ("danger" as const) : ("warning" as const),
        title: `Sensor ${s.cattleName}`,
        message: s.offline
          ? fetchError ?? "Menunggu data dari Firebase Realtime Database"
          : `${s.status} · Suhu ${s.temperature}°C · Baterai ${s.battery}%`,
        time: s.lastUpdate,
        read: false,
      }));

    return NextResponse.json({
      sensors,
      tempHistory,
      alerts,
      cowNames: Object.fromEntries(
        sapiList.map((s: SapiType) => [
          `S${String(s.idsapi).padStart(3, "0")}`,
          s.nama_sapi,
        ])
      ),
      cowEartags: Object.fromEntries(
        sapiList.map((s: SapiType) => [
          `S${String(s.idsapi).padStart(3, "0")}`,
          s.nama_eartag ?? `eartag_${s.idsapi}`,
        ])
      ),
      updatedAt: new Date().toISOString(),
      source: rtdbEmpty ? "mysql-fallback" : "firebase",
      matchedCount,
      fetchError,
    });
  } catch (error) {
    console.error("[/api/sensors GET error]:", error);
    return NextResponse.json(
      { error: "Gagal memuat data sensor" },
      { status: 500 }
    );
  }
}
