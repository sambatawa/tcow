"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FaThermometerHalf, FaBroadcastTower, FaBatteryHalf, FaMapMarkerAlt, FaExclamationTriangle, FaSync, FaArrowUp, FaArrowDown, FaMinus, FaInfoCircle, FaSpinner} from "react-icons/fa";
import { toast } from "sonner";
import { useSensors } from "@/hooks/useSensors";
import { getChartColor } from "@/lib/dashboard";

const suhuRendah  = 38.0;
const suhuTinggi = 39.5;

function buildCowColors(keys: string[]): Record<string, string> {
  return Object.fromEntries(
    keys.map((k, i) => [k, getChartColor(i)])
  );
}

function tempStatus(t: number): { label: string; color: string; bg: string; dot: string } {
  if (t > suhuTinggi)
    return { label: "Demam", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" };
  if (t < suhuRendah)
    return { label: "Rendah", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", dot: "bg-blue-500" };
  return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", dot: "bg-emerald-500" };
}

const statusStyle: Record<string, string> = {
  Aktif: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  "Baterai Rendah": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

function CustomTooltip({
  active,
  payload,
  label,
  cowNames,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  cowNames: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-stone-600 dark:text-stone-300 mb-2">{label}</p>
      {payload.map((p) => {
        const st = tempStatus(p.value);
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-stone-600 dark:text-stone-400">{cowNames[p.dataKey] ?? p.dataKey}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold" style={{ color: p.color }}>
              {p.value.toFixed(1)}°C
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
            </div>
          </div>
        );
      })}
      <div className="border-t border-stone-100 dark:border-stone-800 mt-2 pt-1.5 text-stone-400">
        Suhu normal: {suhuRendah}–{suhuTinggi}°C
      </div>
    </div>
  );
}

function BatteryBar({ level }: { level: number }) {
  const color = level >= 60 ? "bg-emerald-500" : level >= 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${level}%` }} />
      </div>
      <span className={`text-xs font-medium ${level >= 60 ? "text-emerald-600 dark:text-emerald-400" : level >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
        {level}%
      </span>
    </div>
  );
}

function TempDisplay({ temp, offline }: { temp: number; offline?: boolean }) {
  if (offline) return <span className="text-2xl font-bold text-stone-400">—</span>;
  const st = tempStatus(temp);
  return (
    <div className="flex items-end gap-1">
      <span className={`text-3xl font-bold ${st.color}`}>{temp.toFixed(1)}</span>
      <span className={`text-base mb-1 ${st.color}`}>°C</span>
    </div>
  );
}

// ── Trend arrow ───────────────────────────────────────────────────────
function TrendIcon({
  cattleKey,
  history,
}: {
  cattleKey: string;
  history: { label: string; [key: string]: string | number }[];
}) {
  if (history.length < 4) return <FaMinus className="w-4 h-4 text-stone-400" />;
  const last = history[history.length - 1][cattleKey] as number;
  const prev = history[history.length - 4][cattleKey] as number;
  if (typeof last !== "number" || typeof prev !== "number") {
    return <FaMinus className="w-4 h-4 text-stone-400" />;
  }
  const diff = last - prev;
  if (diff > 0.3) return <FaArrowUp className="w-4 h-4 text-red-400" />;
  if (diff < -0.3) return <FaArrowDown className="w-4 h-4 text-emerald-500" />;
  return <FaMinus className="w-4 h-4 text-stone-400" />;
}

export default function SensorMonitoring() {
  const {
    sensors,
    tempHistory: history,
    cowNames,
    loading,
    error,
    refresh,
    updatedAt,
    source,
  } = useSensors(30000);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (sensors.length > 0 && selected.length === 0) {
      const timeout = setTimeout(() => {
        setSelected(sensors.map((s) => s.cattleId));
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [sensors, selected.length]);

  const cowColors = buildCowColors(
    sensors.map((s) => s.cattleId)
  );

  const lastUpdate = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("id-ID")
    : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success("Data sensor diperbarui dari Firebase");
  };

  if (loading && sensors.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin text-[#54cd19]" />
        Memuat data sensor
      </div>
    );
  }

  if (error && sensors.length === 0) {
    return (
      <div className="p-6 text-center text-stone-500">
        <p>{error}</p>
        <p className="text-xs mt-2">Pastikan node dataSensor di Realtime Database tersedia.</p>
      </div>
    );
  }

  const activeCount   = sensors.filter((s) => s.status === "Aktif").length;
  const lowBatCount   = sensors.filter((s) => s.status === "Baterai Rendah").length;
  const errorCount    = sensors.filter((s) => s.status === "Error").length;
  const feverCount    = sensors.filter((s) => s.temperature > suhuTinggi && s.status !== "Error").length;

  
  const toggleCow = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]
    );

  return (
    <div className="p-6 space-y-6">

      {source === "mysql-fallback" && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Data sensor Firebase belum tersedia, hubungi atau lapor ke teknisi.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
            Monitoring Suhu Tubuh Sapi
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 hover:border-emerald-500 text-stone-700 dark:text-stone-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <FaSync className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300">
        <FaInfoCircle className="w-4 h-4 shrink-0" />
        <span>
          Suhu normal sapi: <strong>{suhuRendah}°C – {suhuTinggi}°C</strong>.
          Data direkam setiap 6 jam selama 7 hari untuk kebutuhan analisis Machine Learning perubahan suhu.
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sensor Aktif",   value: activeCount,  icon: FaBroadcastTower,       color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
          { label: "Baterai Rendah", value: lowBatCount,  icon: FaBatteryHalf,     color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
          { label: "Error / Offline",value: errorCount,   icon: FaExclamationTriangle, color: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" },
          { label: "Suhu Tinggi / Demam", value: feverCount, icon: FaThermometerHalf, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <s.icon className="w-5 h-5 mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm mt-0.5 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Monitoring Sapi</h3>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-rows-2 grid-cols-4 gap-4 min-w-max">
          {sensors.map((sensor) => {
            const cowKey = sensor.cattleId;
            const st = sensor.status === "Error" ? null : tempStatus(sensor.temperature);
            const isOffline = sensor.status === "Error";
            return (
              <div key={sensor.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border p-5 space-y-4 transition-all hover:shadow-md ${
                  isOffline
                    ? "border-red-200 dark:border-red-800"
                    : sensor.temperature > suhuTinggi
                    ? "border-amber-300 dark:border-amber-700"
                    : "border-stone-100 dark:border-stone-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cowColors[cowKey] + "22" }}
                    >
                      <FaThermometerHalf className="w-5 h-5" style={{ color: cowColors[cowKey] }} />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">{sensor.cattleName}</p>
                      <p className="text-xs text-stone-400 font-mono">{sensor.id}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[sensor.status] ?? ""}`}>
                    {sensor.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Suhu Tubuh</p>
                    <TempDisplay temp={sensor.temperature} offline={isOffline} />
                    {!isOffline && st && (
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    )}
                    {isOffline && (
                      <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
                        Data terakhir: {sensor.temperature.toFixed(1)}°C
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 text-stone-400">
                    <TrendIcon cattleKey={cowKey} history={history} />
                    <span className="text-[10px] uppercase tracking-wide">Tren</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <FaMapMarkerAlt className="w-3.5 h-3.5" />
                  <span>{sensor.location}</span>
                  <span>·</span>
                  <span>{sensor.lastUpdate}</span>
                </div>
                {/* Baterai */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FaBatteryHalf className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-xs text-stone-400">Baterai</span>
                  </div>
                  <BatteryBar level={sensor.battery} />
                </div>
                {/* Threshold bar */}
                {!isOffline && (
                  <div>
                    <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                      <span>37.5°C</span>
                      <span className="text-emerald-500">Normal {suhuRendah}–{suhuTinggi}°C</span>
                      <span className="text-red-400">41.0°C</span>
                    </div>
                    <div className="relative h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full bg-emerald-100 dark:bg-emerald-900/30"
                        style={{
                          left: `${((suhuRendah - 37.5) / 3.5) * 100}%`,
                          width: `${((suhuTinggi - suhuRendah) / 3.5) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute top-0 h-full w-1 rounded-full transition-all"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((sensor.temperature - 37.5) / 3.5) * 100))}%`,
                          backgroundColor: cowColors[cowKey],
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">
              Grafik Suhu Tubuh — 7 Hari Terakhir
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Riwayat suhu dari Firebase · {history.length} data poin
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cowNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toggleCow(key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selected.includes(key)
                    ? "border-transparent text-white font-medium"
                    : "border-stone-300 dark:border-stone-600 text-stone-400 bg-transparent"
                }`}
                style={selected.includes(key) ? { backgroundColor: cowColors[key] } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {name}
              </button>
            ))}
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 py-16 text-center">
            Belum ada riwayat suhu di Firebase. Pastikan node{" "}
            <code className="text-xs bg-stone-100 dark:bg-stone-800 px-1 rounded">dataSensor</code>{" "}
            terisi di Realtime Database.
          </p>
        ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={history} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeOpacity={0.6} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              interval={3}
              axisLine={{ stroke: "#e7e5e4" }}
            />
            <YAxis
              domain={[37.5, 41.0]}
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}°`}
              width={36}
            />
            <Tooltip content={<CustomTooltip cowNames={cowNames} />} />
            <ReferenceLine
              y={suhuTinggi}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: `Demam >${suhuTinggi}°C`, fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
            />
            <ReferenceLine
              y={suhuRendah}
              stroke="#10b981"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: `Min Normal ${suhuRendah}°C`, fill: "#10b981", fontSize: 10, position: "insideBottomRight" }}
            />
            {Object.entries(cowColors)
              .filter(([key]) => selected.includes(key))
              .map(([key, color]) => (
                <Line
                  key={`cow-line-${key}`}
                  type="monotone"
                  dataKey={key}
                  name={cowNames[key]}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))
            }
          </LineChart>
        </ResponsiveContainer>
        )}

        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {Object.entries(cowNames).map(([key, name]) => (
            <div key={key} className={`flex items-center gap-1.5 text-xs ${selected.includes(key) ? "text-stone-600 dark:text-stone-300" : "text-stone-300 dark:text-stone-600"}`}>
              <div className="w-5 h-0.5 rounded" style={{ backgroundColor: selected.includes(key) ? cowColors[key] : "#d4d4d4" }} />
              {name} ({key})
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">Tabel Data Sensor Suhu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                {["Sensor ID", "Sapi", "Status Sensor", "Lokasi", "Suhu Tubuh", "Status Suhu", "Baterai", "Update Terakhir"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="px-4 pt-4 pb-2 bg-teal-50 dark:bg-teal-900/10 border-y border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide">Kandang Koloni</span>
                    <span className="text-xs text-teal-500">{sensors.length} sensor aktif</span>
                  </div>
                </td>
              </tr>
              {sensors.map((s) => {
                const st = s.status === "Error" ? null : tempStatus(s.temperature);
                return (
                  <tr key={s.id} className={`hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${s.temperature > suhuTinggi && s.status !== "Error" ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cowColors[s.cattleId] }} />
                        <span className="font-medium text-stone-700 dark:text-stone-300">{s.cattleName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[s.status] ?? ""}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{s.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <FaThermometerHalf className="w-3.5 h-3.5 text-stone-400" />
                        <span className={`font-semibold ${s.status === "Error" ? "text-stone-400" : s.temperature > suhuTinggi ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {s.temperature.toFixed(1)}°C
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {st ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${s.battery >= 60 ? "text-emerald-600 dark:text-emerald-400" : s.battery >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                        {s.battery > 0 ? `${s.battery}%` : "Habis"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400">{s.lastUpdate}</td>
                  </tr>
                );
              })}

              <tr>
                <td colSpan={8} className="px-4 pt-4 pb-2 bg-violet-50 dark:bg-violet-900/10 border-y border-violet-200 dark:border-violet-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">Kandang Individu</span>
                    <span className="text-xs text-violet-500">— {sensors.length} sensor aktif</span>
                  </div>
                </td>
              </tr>
              {sensors.map((s) => {
                const st = s.status === "Error" ? null : tempStatus(s.temperature);
                return (
                  <tr key={s.id} className={`hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${s.temperature > suhuTinggi && s.status !== "Error" ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cowColors[s.cattleId] }} />
                        <span className="font-medium text-stone-700 dark:text-stone-300">{s.cattleName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[s.status] ?? ""}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{s.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <FaThermometerHalf className="w-3.5 h-3.5 text-stone-400" />
                        <span className={`font-semibold ${s.status === "Error" ? "text-stone-400" : s.temperature > suhuTinggi ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {s.temperature.toFixed(1)}°C
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {st ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${s.battery >= 60 ? "text-emerald-600 dark:text-emerald-400" : s.battery >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                        {s.battery > 0 ? `${s.battery}%` : "Habis"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400">{s.lastUpdate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
