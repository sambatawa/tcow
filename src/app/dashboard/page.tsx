"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaBalanceScale, FaChevronRight, FaArrowRight, FaHeartbeat, FaExclamationTriangle, FaExclamationCircle,FaInfoCircle, FaCheckCircle,FaDownload,FaSpinner} from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { GiCow } from "react-icons/gi";
import {  XAxis,  YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend} from "recharts";
import { toast } from "sonner";
import { useSensors } from "@/hooks/useSensors";
import { getChartColor, type DashboardData, type DashboardAlert } from "@/lib/dashboard";

function StatCard({title, value, sub,icon: Icon,iconBg,trend,link}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
  link?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {link && (
          <Link
            href={link}
            className="text-stone-400 hover:text-[#54cd19] transition-colors"
          >
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

function AlertItem({ alert }: { alert: DashboardAlert }) {
  const colors = {
    danger: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    warning: "border-[#cfbb99]/30 dark:border-[#cfbb99]/20 bg-[#cfbb99]/10 dark:bg-[#cfbb99]/5 text-amber-800 dark:text-[#cfbb99]",
    info: "border-[#889063]/30 dark:border-[#889063]/20 bg-[#889063]/10 dark:bg-[#889063]/5 text-stone-700 dark:text-stone-300",
    success: "border-[#54cd19]/30 dark:border-[#54cd19]/20 bg-[#54cd19]/10 dark:bg-[#54cd19]/5 text-[#354024] dark:text-[#54cd19]",
  };
  const icons = {
    danger: FaExclamationTriangle,
    warning: FaExclamationCircle,
    info: FaInfoCircle,
    success: FaCheckCircle,
  };
  const Icon = icons[alert.type] || FaInfoCircle;

  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${colors[alert.type] || colors.info}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
          {alert.title}
        </p>
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

const statusStyle: Record<string, string> = {
  Sehat: "border-[#54cd19]/30 dark:border-[#54cd19]/20 bg-[#54cd19]/10 dark:bg-[#54cd19]/5 text-[#354024] dark:text-[#54cd19]",
  Perhatian: "border-[#cfbb99]/30 dark:border-[#cfbb99]/20 bg-[#cfbb99]/10 dark:bg-[#cfbb99]/5 text-amber-800 dark:text-[#cfbb99]",
  Sakit: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

export default function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    tempHistory: sensorHistory,
    cowNames: sensorCowNames,
  } = useSensors(10000);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Gagal memuat dashboard");
        const json = (await res.json()) as DashboardData;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
          toast.error("Gagal memuat data dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = () => {
    if (!data?.cattle.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const csvContent = [
      [
        "ID Sapi",
        "Jenis",
        "Kelamin",
        "Status Kesehatan",
        "Reproduksi",
        "Bobot Akhir (kg)",
        "Pemeriksaan Terakhir",
      ],
      ...data.cattle.map((c) => [
        c.idsapi,
        c.jenis_sapi,
        c.jenis_kelamin,
        c.status_hidup,
        c.reproduksi,
        c.bb_akhir ?? "",
        new Date(c.periksaUpdate).toLocaleString("id-ID"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_sapi_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Data berhasil diekspor");
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

  const { stats, cattle, alerts } = data;
  const total = stats.totalSapi || 1;
  const needsAction = stats.sick;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const chartSeriesKeys = sensorHistory.length > 0
    ? Object.keys(sensorHistory[0]).filter((key) => key !== "label")
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Dashboard peternakan AdyatmaKom
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
        >
          <FaDownload className="w-4 h-4" />
          Ekspor Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sapi Aktif"
          value={`${stats.totalSapi} Ekor`}
          sub={`${stats.healthy} sehat · ${stats.sick} sakit · ${stats.dead} mati`}
          icon={GiCow}
          iconBg="bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#cfbb99]"
          trend="neutral"
          link="/dashboard/cattle"/>
        <StatCard
          title="Data Timbangan"
          value={`${stats.totalFisik} Catatan`}
          sub=""
          icon={FaHeartbeat}
          iconBg="bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#889063]" //bg-[#889063]/30
          trend="neutral"
          link="/dashboard/cattle"/>
        <StatCard
          title="Bobot Rata-rata"
          value={stats.avgWeight !== null ? `${stats.avgWeight} kg` : "—"}
          sub="Rata-rata Berat badan sapi"
          icon={FaBalanceScale}
          iconBg="bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-[#354024] dark:text-[#54cd19]"
          trend="neutral"
          link="/dashboard/cattle"/>
        <StatCard
          title="Perlu Tindakan"
          value={`${needsAction} Sapi`}
          sub={needsAction > 0 ? "Sedang sakit dan darurat" : "Semua sapi aman"}
          icon={FaExclamationTriangle}
          iconBg={needsAction > 0 ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-[#cfbb99]/50 dark:bg-[#cfbb99]/20 text-stone-600 dark:text-stone-400"}
          trend={needsAction > 0 ? "down" : "neutral"}
          link="/dashboard/cattle"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-[#354024] dark:text-[#e5d7c4]">
                Grafik Realtime Suhu Sapi
              </h3>
            </div>
            <Link href="/dashboard/sensors" className="text-xs text-[#54cd19] dark:text-[#889063] hover:underline flex items-center gap-1">
              Detail Sensor <FaChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sensorHistory.length > 0 && chartSeriesKeys.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sensorHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeOpacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a8a29e" }} tickLine={false} axisLine={{ stroke: "#e7e5e4" }}/>
                <YAxis tick={{ fontSize: 10, fill: "#a8a29e" }} tickLine={false} axisLine={false} width={40} domain={[25, 45]} tickFormatter={(v) => `${v}°C`}/>
                <Tooltip formatter={(value, name) => [
                    `${value}°C`, 
                    sensorCowNames[name as string] || `Eartag ${name}`
                  ]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                
                {chartSeriesKeys.map((key, index) => (
                  <Line key={key} type="monotone" dataKey={key} name={sensorCowNames[key] || key} stroke={getChartColor(index)} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} connectNulls/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
              <FaSpinner className="w-6 h-6 animate-spin mb-2 text-[#54cd19]" />
            </div>
          )}

        </div>

        <div className="bg-white dark:bg-[#232b1c] rounded-2xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-5">
          <h3 className="font-semibold text-[#354024] dark:text-[#e5d7c4]  mb-4">Informasi Kesehatan Sapi</h3>
          <div className="space-y-3">
            {[
              { label: "Sehat", count: stats.healthy, color: "bg-[#54cd19]" },
              { label: "Sakit", count: stats.sick, color: "bg-red-500" },
              { label: "Mati", count: stats.dead, color: "bg-stone-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-stone-600 dark:text-[#cfbb99]">{item.label}</span>
                  </div>
                  <span className="font-medium text-[#354024] dark:text-[#e5d7c4]">{item.count} ekor</span>
                </div>
                <div className="h-2 bg-[#e5d7c4]/30 dark:bg-[#354024]/30 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${(item.count / total) * 100}%` }}/>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#e5d7c4]/20 dark:border-[#354024]/30">
            <h4 className="text-xs font-medium text-stone-500 dark:text-[#cfbb99] tracking-wide mb-3">
              Timbangan sapi
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {cattle.length === 0 ? (
              <p className="text-xs text-stone-500">Tidak ada data sapi aktif.</p>
            ) : (cattle.map((c: any) => (
                <div key={c.idsapi} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${statusStyle[c.status_kesehatan] ?? statusStyle.Sehat}`}>
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
            Alert Kesehatan Sapi Hidup
          </h3>
          {unreadAlerts > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              {unreadAlerts} Baru
            </span>
          )}
        </div>
        
        {alerts.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center border border-dashed rounded-xl border-stone-200 dark:border-stone-700">
            Semua parameter eartag IoT terpantau normal. Sapi dalam kondisi sehat.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {alerts.slice(0, 4).map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
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
          <Link key={item.label} href={item.to} className="flex items-center gap-3 bg-white dark:bg-[#232b1c] rounded-xl border border-[#e5d7c4]/20 dark:border-[#354024]/30 p-4 hover:shadow-md transition-shadow">
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