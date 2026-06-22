"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaArrowLeft, FaSyringe, FaHeartbeat,
  FaCalendarAlt, FaStethoscope, FaFlask,
  FaSpinner, FaBatteryQuarter, FaThermometerHalf,
} from "react-icons/fa";
import type {
  CattleListItem,
  MedicalRecord,
  CattleActivity,
} from "@/lib/sapi";
import type { CattleSensorData } from "@/lib/firebase-rtdb";

type Cattle = CattleListItem;

const healthColors: Record<string, string> = {
  Sehat: "bg-[#e7f6d7] dark:bg-[#354024]/30 text-[#54cd19] dark:text-[#54cd19]",
  Perhatian: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Sakit: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const statusColors: Record<string, string> = {
  Laktasi: "bg-[#e7f6d7] dark:bg-[#354024]/30 text-[#54cd19] dark:text-[#54cd19]",
  Bunting: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  Kering: "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400",
  Dara: "bg-[#e7f6d7] dark:bg-[#354024]/30 text-[#54cd19] dark:text-[#54cd19]",
};

export default function CattleProfilePage() {
  const params = useParams();
  const router = useRouter();
  const cattleId = params.id as string;
  
  const [cattle, setCattle] = useState<Cattle | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [activities, setActivities] = useState<CattleActivity[]>([]);
  const [sensorData, setSensorData] = useState<CattleSensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'activity'>('overview');

  const tabs = [
    { key: 'overview', label: 'Ringkasan' },
    { key: 'medical', label: 'Riwayat Medis' },
    { key: 'activity', label: 'Aktivitas' },
  ] as const;

  async function fetchDetail(id: string) {
    const res = await fetch(`/api/sapi/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("not found");
    return res.json() as Promise<{
      cattle: Cattle;
      medicalHistory: MedicalRecord[];
      cattleActivityLog: CattleActivity[];
      sensorData: CattleSensorData | null;
    }>;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const detail = await fetchDetail(cattleId);
        if (cancelled) return;
        setCattle(detail.cattle);
        setSensorData(detail.sensorData);
        setMedicalRecords(detail.medicalHistory);
        setActivities(detail.cattleActivityLog);
      } catch {
        if (!cancelled) setCattle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cattleId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
        Memuat profil sapi...
      </div>
    );
  }

  if (!cattle) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-12 text-center">
          <p className="text-stone-400">Sapi dengan ID {cattleId} tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {cattle.name}
          </h1>
          <p className="text-stone-400 text-sm">{cattle.id} · {cattle.breed}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={"px-3 py-1 rounded-full text-sm font-medium " + healthColors[cattle.health]}>
            {cattle.health}
          </span>
          <span className={"px-3 py-1 rounded-full text-sm font-medium " + statusColors[cattle.status]}>
            {cattle.status}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={"px-4 py-2 rounded-lg text-sm font-medium transition-all " + (
                activeTab === tab.key
                  ? "bg-[#e7f6d7] dark:bg-[#354024]/30 text-[#54cd19] dark:text-[#54cd19]"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Informasi Dasar</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-400">ID Sapi</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.id}</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Nama</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.name}</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Breed</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.breed}</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Tanggal Lahir</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.birthDate}</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Umur</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.age} tahun</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Berat</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Kandang</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.stall}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Status Saat Ini</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-400">Kesehatan</p>
                <span className={"inline-block px-3 py-1 rounded-full text-sm font-medium " + healthColors[cattle.health]}>
                  {cattle.health}
                </span>
              </div>
              <div>
                <p className="text-sm text-stone-400">Status Produksi</p>
                <span className={"inline-block px-3 py-1 rounded-full text-sm font-medium " + statusColors[cattle.status]}>
                  {cattle.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-stone-400">Berat</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-stone-400">Kandang</p>
                <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.stall}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Data Sensor IoT</h3>
            {sensorData?.latestReading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="flex items-center gap-2">
                    <FaThermometerHalf className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-stone-400">Suhu Tubuh (Core)</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{sensorData.latestReading.core_temperature.toFixed(2)}°C</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="flex items-center gap-2">
                    <FaThermometerHalf className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-stone-400">Suhu Telinga</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sensorData.latestReading.ear_temperature.toFixed(2)}°C</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="flex items-center gap-2">
                    <FaBatteryQuarter className="w-4 h-4 text-lime-500" />
                    <span className="text-sm text-stone-400">Baterai</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{sensorData.latestReading.battery_percent}%</p>
                    <p className="text-xs text-stone-400">{sensorData.latestReading.battery_status}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="flex items-center gap-2">
                    <FaHeartbeat className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-stone-400">Status Kesehatan</span>
                  </div>
                  <p className="font-medium text-stone-700 dark:text-stone-300">{sensorData.latestReading.health_status}</p>
                </div>
                <div className="text-xs text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-700">
                  Update: {sensorData.latestReading.timestamp}
                </div>
              </div>
            ) : (
              <p className="text-center text-stone-400 py-8">Belum ada data sensor untuk sapi ini</p>
            )}
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Riwayat Suhu Sensor</h3>
            {sensorData?.historicalReadings && sensorData.historicalReadings.length > 0 ? (
              <div className="space-y-2">
                <div className="h-64 flex items-end justify-around gap-1 p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                  {sensorData.historicalReadings.slice(-20).map((reading, idx) => {
                    const maxTemp = Math.max(
                      ...sensorData.historicalReadings.map(r => r.core_temperature)
                    );
                    const minTemp = Math.min(
                      ...sensorData.historicalReadings.map(r => r.core_temperature)
                    );
                    const range = maxTemp - minTemp || 1;
                    const normalizedHeight = ((reading.core_temperature - minTemp) / range) * 90 + 10;
                    const isNormal = reading.core_temperature >= 36 && reading.core_temperature <= 40;
                    
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t-lg transition-all hover:opacity-80 ${
                          isNormal
                            ? "bg-lime-400 dark:bg-lime-600"
                            : "bg-orange-400 dark:bg-orange-600"
                        }`}
                        style={{ height: `${normalizedHeight}%` }}
                        title={`${reading.core_temperature.toFixed(1)}°C`}
                      />
                    );
                  })}
                </div>
                <div className="text-xs text-stone-400 text-center">
                  {sensorData.historicalReadings.length} pembacaan sensor terbaru
                </div>
              </div>
            ) : (
              <p className="text-center text-stone-400 py-8">Belum ada riwayat suhu tersedia</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Riwayat Medis</h3>
          <div className="space-y-3">
            {medicalRecords.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Belum ada riwayat medis untuk sapi ini</p>
            ) : (
              medicalRecords.map((record) => (
                <div key={record.id} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="mt-0.5">
                    {record.type === "Vaksinasi" && <FaSyringe className="w-4 h-4 text-emerald-500" />}
                    {record.type === "Pemeriksaan" && <FaStethoscope className="w-4 h-4 text-blue-500" />}
                    {record.type === "Pengobatan" && <FaFlask className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{record.type}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{record.description}</p>
                    <p className="text-xs text-stone-400 mt-1">{record.date} · {record.vet}</p>
                  </div>
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (
                    record.status === "Selesai"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  )}>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Log Aktivitas</h3>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Belum ada data aktivitas untuk sapi ini</p>
            ) : (
              activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{activity.date}</span>
                    <span>·</span>
                    <span className="text-stone-400">{activity.petugas}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{activity.type}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{activity.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
