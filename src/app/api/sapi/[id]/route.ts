import { NextRequest, NextResponse } from "next/server";
import { findCattleByParam } from "@/lib/sapi-service";
import { getSensorDataByEartag } from "@/lib/firebase-rtdb";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const { cattle, bundle } = await findCattleByParam(id);
    if (!cattle) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    const cattleId = cattle.id;
    
    // Fetch sensor data from Firebase if eartag exists
    let sensorData = null;
    try {
      const sapiData = await prisma.sapi.findUnique({
        where: { idsapi: cattle.idsapi },
      });
      
      if (sapiData?.nomor_eartag) {
        sensorData = await getSensorDataByEartag(sapiData.nomor_eartag);
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      // Continue without sensor data
    }

    return NextResponse.json({
      cattle,
      medicalHistory: bundle.medicalHistory.filter(
        (m) => m.cattleId === cattleId
      ),
      vaccinationData: bundle.vaccinationData.filter(
        (v) => v.cattleId === cattleId
      ),
      cattleActivityLog: bundle.cattleActivityLog.filter(
        (a) => a.cattleId === cattleId
      ),
      sensorData,
    });
  } catch (error) {
    console.error("[GET /api/sapi/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memuat detail sapi" },
      { status: 500 }
    );
  }
}
