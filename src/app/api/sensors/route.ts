import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildFallbackSensors,
  fetchDataSensorFromRtdb,
  normalizeDataSensor,
} from "@/lib/firebase-rtdb";
import type { DashboardAlert } from "@/lib/dashboard";

export async function GET() {
  try {
    const sapiList = await prisma.sapi.findMany({
      orderBy: { idsapi: "asc" },
      select: { idsapi: true, nama_sapi: true, jenis_kelamin: true },
    });
    const cattleNames = new Map(
      sapiList.map((s) => [s.idsapi, s.nama_sapi])
    );

    const raw = await fetchDataSensorFromRtdb();
    const { sensors: parsedSensors, tempHistory } = normalizeDataSensor(
      raw,
      cattleNames
    );

    const rtdbEmpty = parsedSensors.length === 0;
    const sensors = rtdbEmpty && sapiList.length > 0
      ? buildFallbackSensors(sapiList)
      : parsedSensors;

    const alerts: DashboardAlert[] = sensors
      .filter((s) => s.status !== "Aktif")
      .map((s) => ({
        id: `sensor-${s.id}`,
        type:
          s.status === "Error"
            ? ("danger" as const)
            : ("warning" as const),
        title: `Sensor ${s.cattleName}`,
        message: rtdbEmpty
          ? "Menunggu data dari Firebase Realtime Database"
          : `${s.status} · Suhu ${s.temperature}°C · Baterai ${s.battery}%`,
        time: s.lastUpdate,
        read: false,
      }));

    return NextResponse.json({
      sensors,
      tempHistory,
      alerts,
      cowNames: Object.fromEntries(
        sapiList.map((s) => [
          `S${String(s.idsapi).padStart(3, "0")}`,
          s.nama_sapi,
        ])
      ),
      updatedAt: new Date().toISOString(),
      source: rtdbEmpty ? "mysql-fallback" : "firebase",
    });
  } catch (error) {
    console.error("[GET /api/sensors]", error);
    return NextResponse.json(
      { error: "Gagal memuat data sensor" },
      { status: 500 }
    );
  }
}
