// src/lib/firebase-rtdb.ts

// ==========================================
// 1. Fungsi Pembantu Utilitas & Identifikasi
// ==========================================

export function sensorKeyToIdsapi(key: string): number | null {
  const trimmed = key.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const m = /^S?0*(\d+)$/i.exec(trimmed);
  return m ? parseInt(m[1], 10) : null;
}

export function idsapiToSensorKey(idsapi: number): string {
  return `S${String(idsapi).padStart(3, "0")}`;
}

export type SensorReading = {
  id: string;
  cattleId: string;
  cattleName: string;
  battery: number;
  temperature: number;
  location: string;
  kandangKategori: string;
  status: "Aktif" | "Baterai Rendah" | "Error";
  lastUpdate: string;
  timestamp?: number;
};

export type TempHistoryPoint = {
  label: string;
  [cowKey: string]: string | number;
};

export type CattleSensorReading = {
  core_temperature: number;
  ear_temperature: number;
  battery_percent: number;
  battery_status: string;
  health_status: string;
  timestamp: string;
};

export type CattleSensorData = {
  latestReading: CattleSensorReading;
  historicalReadings: CattleSensorReading[];
};

type RawSensorNode = Record<string, unknown>;

function pickNumber(obj: RawSensorNode, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const normalized = v.trim().replace(/,/g, "");
      if (normalized !== "" && !Number.isNaN(Number(normalized))) {
        return Number(normalized);
      }
    }
  }
  return null;
}

function pickString(obj: RawSensorNode, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function parseSnapshotTimestamp(timeKey: string, node: RawSensorNode): number | null {
  const timestampValue = node["timestamp"] ?? node["updatedAt"] ?? node["time"] ?? node["lastUpdate"];
  const timestampNumber = pickNumber({ timestamp: timestampValue }, ["timestamp"]);
  if (timestampNumber !== null) return timestampNumber;

  if (typeof timeKey === "string") {
    if (timeKey.includes("_")) {
      const [datePart, timePart] = timeKey.split("_");
      const formattedTime = timePart.replace(/-/g, ":");
      const parsed = Date.parse(`${datePart}T${formattedTime}`);
      if (!Number.isNaN(parsed)) return parsed;
    }

    const normalizedKey = timeKey.replace(/_/g, "-");
    const parsed = Date.parse(normalizedKey);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
}

function deriveStatus(
  battery: number | null,
  temperature: number | null,
  staleMinutes: number | null
): SensorReading["status"] {
  if (temperature === null) return "Error";
  if (battery !== null && battery < 30) return "Baterai Rendah";
  if (temperature > 40.5 || temperature < 36) return "Error";
  if (staleMinutes !== null && staleMinutes > 120) return "Error";
  return "Aktif";
}

function formatLastUpdate(ts: number | null): string {
  if (!ts) return "—";
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function isMonitoringObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).some((key) =>
    /^eartag_\d+$/i.test(key) || /^\d+$/.test(key) || /^S0*\d+$/i.test(key)
  );
}

// 2. Core Parser: Normalisasi Data Firebase

export function normalizeDataSensor(
  raw: unknown,
  cattleNames: Map<number, string>
): { sensors: SensorReading[]; tempHistory: TempHistoryPoint[] } {
  if (!raw || typeof raw !== "object") {
    return { sensors: [], tempHistory: [] };
  }

  const sensors: SensorReading[] = [];
  const historyBuckets = new Map<string, TempHistoryPoint>();

  const rawObj = raw as Record<string, unknown>;
  const monitoring =
    rawObj.monitoring && typeof rawObj.monitoring === "object" && !Array.isArray(rawObj.monitoring)
      ? (rawObj.monitoring as Record<string, unknown>)
      : isMonitoringObject(rawObj)
      ? rawObj
      : null;

  if (!monitoring) {
    return { sensors: [], tempHistory: [] };
  }

  Object.entries(monitoring).forEach(([eartagKey, eartagValue]) => {
    if (!eartagValue || typeof eartagValue !== "object") return;

    const timestampsNode = eartagValue as Record<string, unknown>;
    const idSapiAngka = parseInt(eartagKey.replace(/\D/g, ""), 10) || 0;
    const namaSapi = cattleNames.get(idSapiAngka) || `Sapi ${idSapiAngka}`;
    const cowKey = idsapiToSensorKey(idSapiAngka);

    const snapshots = Object.entries(timestampsNode)
      .map(([timeKey, nodeValue]) => {
        if (!nodeValue || typeof nodeValue !== "object") return null;
        const node = nodeValue as RawSensorNode;

        const temperature = pickNumber(node, ["core_temperature", "temperature", "suhu", "temp"]);
        const battery = pickNumber(node, ["battery_percent", "battery", "baterai", "batteryLevel"]);
        const timestamp = parseSnapshotTimestamp(timeKey, node);

        return {
          label: timeKey,
          temperature: temperature ?? null,
          battery: battery ?? null,
          timestamp,
        };
      })
      .filter(
        (item): item is { label: string; temperature: number; battery: number | null; timestamp: number | null } =>
          item !== null && item.temperature !== null
      )
      .sort((a, b) => {
        if (a.timestamp !== null && b.timestamp !== null) return a.timestamp - b.timestamp;
        if (a.timestamp !== null) return 1;
        if (b.timestamp !== null) return -1;
        return a.label.localeCompare(b.label);
      });

    if (snapshots.length === 0) return;

    const latest = snapshots[snapshots.length - 1];
    const staleMinutes = latest.timestamp !== null
      ? Math.floor((Date.now() - latest.timestamp) / 60000)
      : null;

    sensors.push({
      id: pickString(timestampsNode, ["id", "sensorId"]) ?? `SEN-${cowKey}`,
      cattleId: cowKey,
      cattleName: namaSapi,
      battery: latest.battery !== null ? Math.max(0, Math.min(100, Math.round(latest.battery))) : 0,
      temperature: parseFloat(latest.temperature.toFixed(2)),
      location: pickString(timestampsNode, ["lokasi", "location", "posisi"]) || `Kandang ${cowKey}`,
      kandangKategori: "IoT",
      status: deriveStatus(latest.battery, latest.temperature, staleMinutes),
      lastUpdate: formatLastUpdate(latest.timestamp),
      timestamp: latest.timestamp ?? undefined,
    });

    for (const snapshot of snapshots) {
      let graphLabel = snapshot.label;
      if (snapshot.label.includes("_")) {
        graphLabel = snapshot.label.split("_")[1].substring(0, 5).replace("-", ":");
      }

      if (!historyBuckets.has(graphLabel)) {
        historyBuckets.set(graphLabel, { label: graphLabel });
      }
      historyBuckets.get(graphLabel)![cowKey] = parseFloat(snapshot.temperature.toFixed(2));
    }
  });

  const tempHistory = Array.from(historyBuckets.values())
    .sort((a, b) => String(a.label).localeCompare(String(b.label)))
    .slice(-32);

  return { sensors, tempHistory };
}
// Jembatan URL & Fetching REST API

export function getRtdbUrl(): string {
  const explicit =
    process.env.FIREBASE_DATABASE_URL ??
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const projectId = process.env.FIREBASE_PROJECTID;
  if (!projectId) {
    throw new Error("FIREBASE_DATABASE_URL atau FIREBASE_PROJECTID wajib diset di .env.local");
  }
  return `https://${projectId}-default-rtdb.firebaseio.com`;
}

export async function fetchDataSensorFromRtdb(): Promise<unknown | null> {
  const base = getRtdbUrl();
  const candidates = ["/monitoring.json", "/dataSensor.json", "/.json"];

  for (const path of candidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        cache: "no-store",
      });
      if (res.status === 404) continue;
      if (!res.ok) continue;
      const data = await res.json();
      if (data === null) continue;
      return data;
    } catch {
      continue;
    }
  }

  return null;
}

export function buildFallbackSensors(
  sapiList: { idsapi: number; nama_sapi: string; jenis_kelamin: string }[]
): SensorReading[] {
  return sapiList.map((s) => {
    const cattleId = idsapiToSensorKey(s.idsapi);
    return {
      id: `SEN-${cattleId}`,
      cattleId,
      cattleName: s.nama_sapi,
      battery: 0,
      temperature: 0,
      location: `Kandang ${cattleId}`,
      kandangKategori: s.jenis_kelamin === "Betina" ? "Individu" : "Koloni",
      status: "Error" as const,
      lastUpdate: "Menunggu data Firebase",
    };
  });
}