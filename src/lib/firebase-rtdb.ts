export function formatKandangLabel(kandang: string): string {
  if (kandang === "KoloniBesar") return "Koloni Besar";
  if (kandang === "KandangDara") return "Kandang Dara";
  return kandang;
}

export function sensorKeyToIdsapi(key: string): number | null {
  const trimmed = key.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const eartagMatch = /^eartag[_-]?(\d+)$/i.exec(trimmed);
  if (eartagMatch) return parseInt(eartagMatch[1], 10);
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
  offline?: boolean;
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

export type HealthAlert = {
  id: string;
  type: "danger" | "warning";
  title: string;
  message: string;
  time: string;
  read: boolean;
  cattleId: string;
  cattleName: string;
  eartag: string;
  temperature: number;
  healthStatus: string;
};

export function extractHealthAlerts( raw: unknown, cattleNames: Map<number, string>, cattleEartags?: Map<number, string>): HealthAlert[] {
  const monitoring = extractMonitoringNode(raw);
  if (!monitoring) return [];
  const byEartag = collectSnapshots(monitoring);
  const alerts: HealthAlert[] = [];
  byEartag.forEach((snapshots, eartagKey) => {
    if (snapshots.length === 0) return;

    const latest = snapshots[snapshots.length - 1];
    const idSapiAngka = sensorKeyToIdsapi(eartagKey) ?? 0;
    const cowKey = idsapiToSensorKey(idSapiAngka);
    const namaSapi = cattleNames.get(idSapiAngka) || `Sapi ${idSapiAngka}`;
    const eartagFromDb = cattleEartags?.get(idSapiAngka);
    const eartagDisplay = eartagFromDb || cowKey;
    const healthStatus = pickString(latest.node, ["health_status", "healthStatus"]) ?? deriveHealthStatus(latest.temperature);
    const temperature = latest.temperature;

    if (healthStatus.toLowerCase() === "warning" || healthStatus.toLowerCase() === "critical") {
      const alertType: "danger" | "warning" = healthStatus.toLowerCase() === "critical" ? "danger" : "warning";
      let message = "";
      if (healthStatus.toLowerCase() === "critical" || temperature > 40) {
        message = `Suhu tubuh sangat tinggi: ${temperature.toFixed(1)}°C. Perlu penanganan segera!`;
      } else if (healthStatus.toLowerCase() === "warning" || temperature > 39.5) {
        message = `Suhu tubuh meningkat: ${temperature.toFixed(1)}°C. Perlu perhatian.`;
      } else {
        message = `Kondisi kesehatan ${healthStatus}. Suhu: ${temperature.toFixed(1)}°C`;
      }

      alerts.push({
        id: `alert-${eartagKey}-${Date.now()}`,
        type: alertType,
        title: namaSapi,
        message: message,
        time: formatLastUpdate(latest.timestamp),
        read: false,
        cattleId: cowKey,
        cattleName: namaSapi,
        eartag: eartagDisplay,
        temperature,
        healthStatus,
      });
    }
  });
  return alerts;
}

type RawSensorNode = Record<string, unknown>;

type Snapshot = {
  label: string;
  temperature: number;
  battery: number | null;
  timestamp: number | null;
  node: RawSensorNode;
};

type MonitoringLayout = "eartag-first" | "timestamp-first";

const TEMPERATURE_KEYS = [
  "core_temperature",
  "temperature",
  "suhu",
  "temp",
  "body_temperature",
] as const;

const BATTERY_KEYS = [
  "battery_percent",
  "battery",
  "baterai",
  "batteryLevel",
] as const;

const SENSOR_FIELD_KEYS = new Set([
  ...TEMPERATURE_KEYS,
  ...BATTERY_KEYS,
  "ear_temperature",
  "ear_temp",
  "battery_status",
  "health_status",
  "timestamp",
  "updatedAt",
  "time",
  "lastUpdate",
]);

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (normalized !== "" && !Number.isNaN(Number(normalized))) {
      return Number(normalized);
    }
  }
  return null;
}

function pickNumber(obj: RawSensorNode, keys: readonly string[] | string[]): number | null {
  for (const k of keys) {
    const direct = coerceNumber(obj[k]);
    if (direct !== null) return direct;
  }

  for (const value of Object.values(obj)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const k of keys) {
      const nested = coerceNumber((value as RawSensorNode)[k]);
      if (nested !== null) return nested;
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

function isSensorReadingNode(node: RawSensorNode): boolean {
  return pickNumber(node, TEMPERATURE_KEYS) !== null;
}

function parseSnapshotTimestamp(timeKey: string, node: RawSensorNode): number | null {
  const timestampValue =
    node["timestamp"] ?? node["updatedAt"] ?? node["time"] ?? node["lastUpdate"];
  const timestampNumber = coerceNumber(timestampValue);
  if (timestampNumber !== null) {
    return timestampNumber > 1_000_000_000_000
      ? timestampNumber
      : timestampNumber * 1000;
  }

  if (typeof timeKey !== "string" || timeKey === "latest") {
    return null;
  }

  if (timeKey.includes("_")) {
    const [datePart, timePart] = timeKey.split("_");
    const formattedTime = timePart.replace(/-/g, ":");
    const candidates = [
      `${datePart}T${formattedTime}+07:00`,
      `${datePart}T${formattedTime}Z`,
      `${datePart}T${formattedTime}`,
    ];
    for (const iso of candidates) {
      const parsed = Date.parse(iso);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  const normalizedKey = timeKey.replace(/_/g, "-");
  const parsed = Date.parse(normalizedKey);
  if (!Number.isNaN(parsed)) return parsed;

  return null;
}

function isEartagKey(key: string): boolean {
  return (
    /^eartag[_-]?\d+$/i.test(key) ||
    /^\d+$/.test(key) ||
    /^S0*\d+$/i.test(key)
  );
}

function isTimestampKey(key: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(key) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(key) ||
    /^\d{4}-\d{2}-\d{2}$/.test(key) ||
    /^\d{4}-\d{2}-\d{2}[_T]\d{2}[-:]\d{2}/.test(key)
  );
}

function isReadingChildKey(key: string, value: unknown): boolean {
  if (isTimestampKey(key)) return true;
  if (key === "latest" || key === "current") return true;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return isSensorReadingNode(value as RawSensorNode);
  }
  return false;
}

function detectMonitoringLayout(
  monitoring: Record<string, unknown>
): MonitoringLayout | null {
  const keys = Object.keys(monitoring);
  if (keys.length === 0) return null;

  if (keys.some(isEartagKey)) return "eartag-first";

  if (keys.some(isTimestampKey)) {
    const firstValue = monitoring[keys[0]];
    if (firstValue && typeof firstValue === "object" && !Array.isArray(firstValue)) {
      const childKeys = Object.keys(firstValue as Record<string, unknown>);
      if (childKeys.some(isEartagKey)) return "timestamp-first";
    }
  }

  return null;
}

function extractMonitoringNode(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;

  const rawObj = raw as Record<string, unknown>;
  if (
    rawObj.monitoring &&
    typeof rawObj.monitoring === "object" &&
    !Array.isArray(rawObj.monitoring)
  ) {
    return rawObj.monitoring as Record<string, unknown>;
  }

  if (detectMonitoringLayout(rawObj)) {
    return rawObj;
  }

  return null;
}

function parseSensorSnapshot(timeKey: string, node: RawSensorNode): Snapshot | null {
  const temperature = pickNumber(node, TEMPERATURE_KEYS);
  if (temperature === null) return null;

  const battery = pickNumber(node, BATTERY_KEYS);
  const timestamp = parseSnapshotTimestamp(timeKey, node);
  return {
    label: timeKey,
    temperature,
    battery,
    timestamp,
    node,
  };
}

function sortSnapshots(a: Snapshot, b: Snapshot): number {
  if (a.timestamp !== null && b.timestamp !== null) return a.timestamp - b.timestamp;
  if (a.timestamp !== null) return 1;
  if (b.timestamp !== null) return -1;
  return a.label.localeCompare(b.label);
}

function collectSnapshotsFromEartag(
  eartagValue: Record<string, unknown>
): Snapshot[] {
  const snapshots: Snapshot[] = [];

  if (isSensorReadingNode(eartagValue)) {
    const flat = parseSensorSnapshot("latest", eartagValue);
    if (flat) snapshots.push(flat);
  }

  Object.entries(eartagValue).forEach(([timeKey, nodeValue]) => {
    if (SENSOR_FIELD_KEYS.has(timeKey)) return;
    if (!nodeValue || typeof nodeValue !== "object" || Array.isArray(nodeValue)) {
      return;
    }
    if (!isReadingChildKey(timeKey, nodeValue)) return;

    const snapshot = parseSensorSnapshot(timeKey, nodeValue as RawSensorNode);
    if (snapshot) snapshots.push(snapshot);
  });

  return snapshots.sort(sortSnapshots);
}

function collectSnapshots(
  monitoring: Record<string, unknown>
): Map<string, Snapshot[]> {
  const layout = detectMonitoringLayout(monitoring);
  const byEartag = new Map<string, Snapshot[]>();

  if (layout === "eartag-first") {
    Object.entries(monitoring).forEach(([eartagKey, eartagValue]) => {
      if (!isEartagKey(eartagKey) || !eartagValue || typeof eartagValue !== "object") {
        return;
      }

      const snapshots = collectSnapshotsFromEartag(
        eartagValue as Record<string, unknown>
      );
      if (snapshots.length > 0) {
        byEartag.set(eartagKey, snapshots);
      }
    });
    return byEartag;
  }

  if (layout === "timestamp-first") {
    Object.entries(monitoring).forEach(([timeKey, timeValue]) => {
      if (!isTimestampKey(timeKey) || !timeValue || typeof timeValue !== "object") {
        return;
      }

      Object.entries(timeValue as Record<string, unknown>).forEach(
        ([eartagKey, nodeValue]) => {
          if (!isEartagKey(eartagKey) || !nodeValue || typeof nodeValue !== "object") {
            return;
          }

          const snapshot = parseSensorSnapshot(timeKey, nodeValue as RawSensorNode);
          if (!snapshot) return;

          if (!byEartag.has(eartagKey)) byEartag.set(eartagKey, []);
          byEartag.get(eartagKey)!.push(snapshot);
        }
      );
    });

    byEartag.forEach((snapshots, key) => {
      byEartag.set(key, snapshots.sort(sortSnapshots));
    });
  }

  return byEartag;
}

function staleThresholdMinutes(): number | null {
  if (process.env.NODE_ENV === "development") return null;
  const raw = process.env.FIREBASE_STALE_MINUTES;
  if (raw === "0" || raw === "off") return null;
  const parsed = raw ? Number(raw) : 360;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 360;
}

function deriveHealthStatus(temperature: number): string {
  if (temperature > 39.5) return "Demam";
  if (temperature < 38) return "Suhu Rendah";
  return "Normal";
}

function deriveStatus(
  battery: number | null,
  temperature: number | null,
  staleMinutes: number | null
): { status: SensorReading["status"]; offline: boolean } {
  if (temperature === null) {
    return { status: "Error", offline: true };
  }

  if (battery !== null && battery < 30) {
    return { status: "Baterai Rendah", offline: false };
  }

  if (temperature > 40.5 || temperature < 36) {
    return { status: "Error", offline: false };
  }

  const threshold = staleThresholdMinutes();
  if (threshold !== null && staleMinutes !== null && staleMinutes > threshold) {
    return { status: "Error", offline: false };
  }

  return { status: "Aktif", offline: false };
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

function graphLabelFromSnapshot(snapshot: Snapshot): string {
  if (snapshot.timestamp !== null) {
    return new Date(snapshot.timestamp).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (snapshot.label.includes("_")) {
    return snapshot.label.split("_")[1].substring(0, 5).replace("-", ":");
  }

  return snapshot.label;
}

function snapshotToCattleReading(snapshot: Snapshot): CattleSensorReading {
  const node = snapshot.node;
  const core =
    pickNumber(node, TEMPERATURE_KEYS) ?? snapshot.temperature;
  const ear =
    pickNumber(node, ["ear_temperature", "ear_temp", "suhu_telinga"]) ?? core;

  return {
    core_temperature: parseFloat(core.toFixed(2)),
    ear_temperature: parseFloat(ear.toFixed(2)),
    battery_percent:
      snapshot.battery !== null
        ? Math.max(0, Math.min(100, Math.round(snapshot.battery)))
        : 0,
    battery_status:
      pickString(node, ["battery_status", "batteryStatus"]) ??
      (snapshot.battery !== null && snapshot.battery < 30 ? "Low" : "Normal"),
    health_status:
      pickString(node, ["health_status", "healthStatus"]) ??
      deriveHealthStatus(core),
    timestamp: snapshot.label,
  };
}

export function normalizeDataSensor(
  raw: unknown,
  cattleNames: Map<number, string>,
  cattleKandang?: Map<number, string>,
  cattleEartag?: Map<number, string>,
  eartagToIdsapi?: Map<string, number>
): { sensors: SensorReading[]; tempHistory: TempHistoryPoint[] } {
  const monitoring = extractMonitoringNode(raw);
  if (!monitoring) {
    return { sensors: [], tempHistory: [] };
  }

  const byEartag = collectSnapshots(monitoring);
  const sensors: SensorReading[] = [];
  const historyBuckets = new Map<string, TempHistoryPoint>();

  byEartag.forEach((snapshots, eartagKey) => {
    if (snapshots.length === 0) return;
    let idSapiAngka: number;
    if (eartagToIdsapi && eartagToIdsapi.has(eartagKey.toLowerCase())) {
      idSapiAngka = eartagToIdsapi.get(eartagKey.toLowerCase())!;
    } else {
      idSapiAngka = sensorKeyToIdsapi(eartagKey) ?? 0;
    }

    const cowKey = idsapiToSensorKey(idSapiAngka);
    const namaSapi = cattleNames.get(idSapiAngka) || `Sapi ${idSapiAngka}`;
    const latest = snapshots[snapshots.length - 1];

    const staleMinutes =
      latest.timestamp !== null
        ? Math.floor((Date.now() - latest.timestamp) / 60000)
        : null;

    const dbKandang = cattleKandang?.get(idSapiAngka);
    const rtdbLokasi = pickString(latest.node, ["lokasi", "location", "posisi"]);
    const location = rtdbLokasi || (dbKandang ? formatKandangLabel(dbKandang) : `Kandang ${cowKey}`);
    const eartag = cattleEartag?.get(idSapiAngka) || eartagKey;

    const { status, offline } = deriveStatus(latest.battery, latest.temperature, staleMinutes);
    sensors.push({
      id: eartag,
      cattleId: cowKey,
      cattleName: namaSapi,
      battery: latest.battery !== null ? Math.max(0, Math.min(100, Math.round(latest.battery))) : 0,
      temperature: parseFloat(latest.temperature.toFixed(2)),
      location,
      kandangKategori: "IoT",
      status,
      offline,
      lastUpdate: formatLastUpdate(latest.timestamp),
      timestamp: latest.timestamp ?? undefined,
    });

    for (const snapshot of snapshots) {
      const graphLabel = graphLabelFromSnapshot(snapshot);
      if (!historyBuckets.has(graphLabel)) {
        historyBuckets.set(graphLabel, { label: graphLabel });
      }
      historyBuckets.get(graphLabel)![cowKey] = parseFloat(
        snapshot.temperature.toFixed(2)
      );
    }
  });

  const tempHistory = Array.from(historyBuckets.values()).sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(-32);
  sensors.sort((a, b) => a.cattleId.localeCompare(b.cattleId));
  return { sensors, tempHistory };
}

export function buildCattleSensorData(
  raw: unknown,
  idsapi: number
): CattleSensorData | null {
  const monitoring = extractMonitoringNode(raw);
  if (!monitoring) return null;

  const byEartag = collectSnapshots(monitoring);
  const targetKey = [...byEartag.keys()].find(
    (key) => (sensorKeyToIdsapi(key) ?? -1) === idsapi
  );

  if (!targetKey) return null;

  const snapshots = byEartag.get(targetKey);
  if (!snapshots?.length) return null;

  return {
    latestReading: snapshotToCattleReading(snapshots[snapshots.length - 1]),
    historicalReadings: snapshots.map(snapshotToCattleReading),
  };
}

export function buildFallbackSensors(
  sapiList: { idsapi: number; nama_sapi: string; jenis_kelamin: string; kandang: string; nomor_eartag: string | null }[],
  cattleEartag?: Map<number, string>
): SensorReading[] {
  return sapiList.map((s) => {
    const cattleId = idsapiToSensorKey(s.idsapi);
    const eartag = cattleEartag?.get(s.idsapi) || s.nomor_eartag || `EARTAG-${s.idsapi}`;
    return {
      id: eartag,
      cattleId,
      cattleName: s.nama_sapi,
      battery: 0,
      temperature: 0,
      location: formatKandangLabel(s.kandang),
      kandangKategori: "IoT",
      status: "Error" as const,
      offline: true,
      lastUpdate: "Menunggu data Firebase",
    };
  });
}


function normalizeRtdbBaseUrl(url: string): string {
  let base = url.replace(/^["']|["']$/g, "").replace(/\/$/, "");
  if (/\.firebaseio\.com$/i.test(base)) {
    const projectMatch = /https:\/\/([^.]+)(?:-default-rtdb)?\.firebaseio\.com/i.exec(
      base
    );
    if (projectMatch) {
      base = `https://${projectMatch[1]}-default-rtdb.asia-southeast1.firebasedatabase.app`;
    }
  }

  return base;
}

export function getRtdbUrl(): string {
  const explicit =
    process.env.FIREBASE_DATABASE_URL ??
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (explicit) {
    return normalizeRtdbBaseUrl(explicit);
  }

  const projectId =
    process.env.FIREBASE_PROJECTID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECTID;
  if (!projectId) {
    throw new Error(
      "FIREBASE_DATABASE_URL atau FIREBASE_PROJECTID wajib diset di .env"
    );
  }

  return `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
}

function getRtdbAuthQuery(): string {
  const secret =
    process.env.FIREBASE_DATABASE_SECRET ??
    process.env.FIREBASE_RTDB_SECRET ??
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_SECRET;
  if (!secret?.trim()) return "";
  return `?auth=${encodeURIComponent(secret.trim())}`;
}

function buildRtdbFetchUrl(base: string, path: string): string {
  const authQuery = getRtdbAuthQuery();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (authQuery) {
    return `${base}${normalizedPath}${authQuery}`;
  }
  return `${base}${normalizedPath}`;
}

export type RtdbFetchResult = {
  data: unknown | null;
  error: string | null;
  path: string | null;
};

export async function fetchDataSensorFromRtdb(): Promise<unknown | null> {
  const result = await fetchDataSensorFromRtdbDetailed();
  return result.data;
}

export async function fetchDataSensorFromRtdbDetailed(): Promise<RtdbFetchResult> {
  const base = getRtdbUrl();
  const candidates = ["/monitoring.json"];
  let lastError: string | null = null;

  for (const path of candidates) {
    const url = buildRtdbFetchUrl(base, path);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 404) continue;

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastError = `database ${path} → HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`;
        continue;
      }

      const data = await res.json();
      if (data === null) continue;

      if (typeof data === "object" && data !== null && "error" in data) {
        lastError = `database ${path} → ${(data as { error: string }).error}`;
        continue;
      }

      return { data, error: null, path };
    } catch (error) {
      lastError = `databae ${path} gagal: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  if (lastError?.includes("401")) {
    return {
      data: null,
      error:
        "Firebase Permission denied. Cek Firebase Console",
      path: null,
    };
  }

  return { data: null, error: lastError, path: null };
}