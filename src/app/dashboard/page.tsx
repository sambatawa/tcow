"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FaBalanceScale, FaChevronRight, FaArrowRight, FaHeartbeat, FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaDownload, FaSpinner } from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { GiCow } from "react-icons/gi";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine } from "recharts";
import { swalSuccess, swalError } from "@/lib/swal";
import { useSensors } from "@/hooks/useSensors";
import { useNotifications } from "@/hooks/useNotifications";
import { getChartColor, type DashboardData, type DashboardAlert } from "@/lib/dashboard";
import { alertColors, dashboardStatusStyle, healthProgressColors } from "@/lib/styles";
import { type HealthAlert } from "@/lib/firebase-rtdb";

function StatCard({ title, value, sub, icon: Icon, iconBg, trend, link }: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
  link?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5 transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {link && (
          <Link href={link} className="text-stone-400 hover:text-[#54cd19] transition-colors">
            <FaArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-stone-500 dark:text-[#cfbb99]">{title}</p>
        <p className="text-2xl font-bold text-[#354024] dark:text-[#e5d7c4] mt-1">
          {value}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend === "up" && (
            <FaArrowUp className="w-3.5 h-3.5 text-[#54cd19]" />
          )}
          {trend === "down" && (
            <FaArrowDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={`text-xs ${
              trend === "up"
                ? "text-[#54cd19] dark:text-[#889063]"
                : trend === "down"
                  ? "text-red-500"
                  : "text-stone-400"
            }`}>
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert, eartag }: { alert: DashboardAlert; eartag?: string }) {
  const icons = {
    danger: FaExclamationTriangle,
    warning: FaExclamationCircle,
    info: FaInfoCircle,
    success: FaCheckCircle,
  };
  const Icon = icons[alert.type] || FaInfoCircle;

  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${alertColors[alert.type] || alertColors.info}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
            {alert.title}
          </p>
          {eartag && (
            <span className="text-xs px-2 py-0.5 bg-stone-200 dark:bg-stone-700 rounded-full text-stone-600 dark:text-stone-300 shrink-0">
              {eartag}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
          {alert.message}
        </p>
        <p className="text-xs text-stone-400 mt-1">{alert.time}</p>
      </div>
      {!alert.read && (
        <div className="w-2 h-2 bg-[#54cd19] rounded-full mt-1.5 shrink-0" />
      )}
    </div>
  );
}

function healthAlertToDashboardAlert(alert: HealthAlert): DashboardAlert & { eartag?: string } {
  return {
    id: alert.id,
    type: alert.type,
    title: alert.title,
    message: alert.message,
    time: alert.time,
    read: alert.read,
    eartag: alert.eartag,
  };
}

// Custom tooltip untuk grafik suhu (sama seperti di sensors page)
function CustomTempTooltip({
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

  const tempStatus = (t: number) => {
    if (t > 39.5)
      return { label: "Demam", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" };
    if (t < 38.0)
      return { label: "Rendah", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" };
    return { label: "Normal", color: "text-[#54cd19] dark:text-[#889063]", bg: "bg-[#e5d7c4]/30 dark:bg-[#354024]/30" };
  };

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
        Suhu normal: 38.0–39.5°C
      </div>
    </div>
  );
}

export default function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimmedCows, setDimmedCows] = useState<Set<string>>(new Set());
  const { tempHistory: sensorHistory, cowNames: sensorCowNames, cowEartags: sensorCowEartags } = useSensors(10000);
  const { alerts: firebaseAlerts } = useNotifications(10000);

  // Fetch dashboard data from API
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Gagal mengambil data dashboard");
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error mengambil data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Derived state for chart - must be before any useEffect that depends on it
  const chartSeriesKeys = useMemo(() => {
    return (sensorHistory?.length ?? 0) > 0
      ? Object.keys(sensorHistory[0]).filter((key) => key !== "label")
      : [];
  }, [sensorHistory]);

  // Constants for temperature thresholds
  const suhuRendah = 38.0;
  const suhuTinggi = 39.5;

  // Reset dimmed cows when sensor data changes
  useEffect(() => {
    setDimmedCows(new Set());
  }, [sensorHistory]);

  const toggleCowDim = (key: string) => {
    setDimmedCows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    if (!data?.cattle.length) {
      swalError("Gagal", "Tidak ada data untuk diekspor");
      return;
    }
    const csvContent = [
      ["ID Sapi", "Jenis", "Kelamin", "Status Kesehatan", "Reproduksi", "Bobot Akhir (kg)", "Pemeriksaan Terakhir"],
      ...data.cattle.map((c) => [
        c.idsapi,
        c.jenis_sapi,
        c.jenis_kelamin,
        c.status_hidup,
        c.reproduksi,
        c.bb_akhir ?? "",
        new Date(c.periksaUpdate).toLocaleString("id-ID"),
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_sapi_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    swalSuccess("Berhasil", "Data berhasil diekspor");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin text-[#54cd19]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-stone-500">
        <p>{error ?? "Data tidak tersedia"}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 text-sm text-[#54cd19] hover:underline">
          Muat ulang
        </button>
      </div>
    );
  }

  const { stats, cattle } = data ?? { stats: null, cattle: [] };
  const total = stats?.totalSapi || 1;
  const needsAction = firebaseAlerts?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Dashboard peternakan T-Cow
        </p>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm">
          <FaDownload className="w-3 h-3" />
          <span className="hidden lg:block">Ekspor Data</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sapi"
          value={`${stats.totalSapi} Ekor`}
          sub={`${stats.healthy} sehat ${stats.sick} sakit ${stats.dead} mati`}
          icon={GiCow}
          iconBg="bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#889063]"
          trend="neutral"
          link="/dashboard/cattle"
        />
        <StatCard
          title="Data Timbangan"
          value={`${stats.totalFisik} Catatan`}
          sub=""
          icon={FaHeartbeat}
          iconBg="bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#889063]"
          trend="neutral"
          link="/dashboard/cattle"
        />
        <StatCard
          title="Bobot Rata-rata"
          value={stats.avgWeight !== null ? `${stats.avgWeight} kg` : "—"}
          sub="Rata-rata Berat badan sapi"
          icon={FaBalanceScale}
          iconBg="bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#889063]"
          trend="neutral"
          link="/dashboard/cattle"
        />
        <StatCard
          title="Perlu Tindakan"
          value={`${needsAction} Sapi`}
          sub={needsAction > 0 ? "Ada indikasi sensor tidak normal" : "Semua sapi aman"}
          icon={FaExclamationTriangle}
          iconBg={needsAction > 0 ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#889063]"}
          trend={needsAction > 0 ? "down" : "neutral"}
          link="/dashboard/cattle"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-[#354024] dark:text-[#e5d7c4]">
                Grafik Suhu Sapi
              </h3>
            </div>
            <Link href="/dashboard/sensors" className="text-xs text-[#54cd19] dark:text-[#889063] hover:underline flex items-center gap-1">
              Detail Sensor <FaChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sensorHistory.length > 0 && chartSeriesKeys.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={sensorHistory} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#a8a29e" }}
                    tickLine={false}
                    interval={3}
                    axisLine={{ stroke: "#e7e5e4" }}
                  />
                  <YAxis
                    domain={[20, 50]}
                    tick={{ fontSize: 11, fill: "#a8a29e" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}°`}
                    width={36}
                  />
                  <Tooltip content={<CustomTempTooltip cowNames={sensorCowNames} />} />
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
                  {chartSeriesKeys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={sensorCowNames[key] || key}
                      stroke={getChartColor(index)}
                      strokeWidth={2}
                      strokeOpacity={dimmedCows.has(key) ? 0.2 : 1}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                      onClick={() => toggleCowDim(key)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4 px-1">
                {chartSeriesKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleCowDim(key)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${
                      dimmedCows.has(key)
                        ? "border-stone-300 dark:border-stone-600 text-stone-400 bg-stone-100 dark:bg-stone-800 opacity-50"
                        : "border-transparent text-white font-medium"
                    }`}
                    style={!dimmedCows.has(key) ? { backgroundColor: getChartColor(chartSeriesKeys.indexOf(key)) } : {}}
                  >
                    <span>{sensorCowNames[key] || key}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
              <FaSpinner className="w-6 h-6 animate-spin mb-2 text-[#54cd19]" />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5">
          <h3 className="font-semibold text-[#354024] dark:text-[#e5d7c4] mb-4">Informasi Kesehatan Sapi</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: "Sehat", count: stats.healthy, color: healthProgressColors.Sehat },
              { label: "Sakit", count: stats.sick, color: healthProgressColors.Sakit },
              { label: "Mati", count: stats.dead, color: healthProgressColors.Mati },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-end items-center mb-1.5">
                  <span className="font-semibold text-[#3e9413] dark:text-[#e5d7c4]">
                    {item.count} ekor
                  </span>
                </div>
                <div className="h-6 bg-[#e5d7c4]/30 dark:bg-[#354024]/30 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700 flex items-center justify-end px-3`} style={{ width: `${(item.count / total) * 100}%` }}  >
                    <span className="text-[10px] font-bold uppercase tracking-wide truncate whitespace-nowrap text-white/90 drop-shadow-sm">
                      {item.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[#e5d7c4]/20 dark:border-[#354024]/30">
            <h4 className="text-xs font-medium text-stone-500 dark:text-[#cfbb99] tracking-wide mb-3">
              Timbangan sapi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-2 scrollbar-hide custom-scrollbar">
            {cattle.length === 0 ? (
              <p className="text-xs text-stone-500">Tidak ada data sapi aktif.</p>
            ) : (cattle.map((c: any) => (
                <div key={c.idsapi} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${dashboardStatusStyle[c.status_kesehatan] ?? dashboardStatusStyle.Sehat}`}>
                  <span className="font-medium truncate mr-2">{c.nama_sapi || `Sapi ${c.idsapi}`}</span>
                  <span className="font-semibold shrink-0">
                    {c.bb_akhir !== null ? `${c.bb_akhir} kg` : c.status_kesehatan}
                  </span>
                </div>
              ))
            )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#354024] dark:text-[#e5d7c4]">
            Notifikasi Kesehatan Sapi Hidup
          </h3>
          {firebaseAlerts.length > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              {firebaseAlerts.length} Notifikasi
            </span>
          )}
        </div>

        {firebaseAlerts.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-stone-400 mt-1">Tidak ada notifikasi kesehatan</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {firebaseAlerts.slice(0, 4).map((alert) => (
              <AlertItem key={alert.id} alert={healthAlertToDashboardAlert(alert)} eartag={alert.eartag} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "/dashboard/cattle", icon: GiCow, label: "Kelola Sapi", count: `${stats.totalSapi} ekor` },
          { to: "/dashboard/sensors", icon: FaBalanceScale, label: "Monitoring Sensor", count: "Suhu telinga realtime" },
          { to: "/dashboard/cattle", icon: FaExclamationTriangle, label: "Butuh Penanganan", count: `${needsAction} ekor diperiksa` },
        ].map((item) => (
          <Link key={item.label} href={item.to} className="flex items-center gap-3 bg-white dark:bg-[#232b1c] rounded-xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-4 transition-shadow">
            <div className="w-8 h-8 rounded-lg bg-[#54cd19]/30 dark:bg-[#54cd19]/20 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#354024] dark:text-[#54cd19]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#354024] dark:text-[#e5d7c4]">{item.label}</div>
              <div className="text-xs text-stone-400 dark:text-[#cfbb99] mt-0.5">{item.count}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
