"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaHeartbeat, FaStethoscope, FaSpinner, FaBatteryQuarter, FaThermometerHalf, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { swalSuccess, swalError } from "@/lib/swal";
import Modal from "@/components/ui/Modal";
import { formatKandangLabel } from "@/lib/sapi";
import { cattleHealthColors, statusColors } from "@/lib/styles";
import type { ActivityInput, CattleListItem, CattleActivity, MedicalRecord, MedicalRecordInput} from "@/lib/sapi";
import type { CattleSensorData } from "@/lib/firebase-rtdb";

type Cattle = CattleListItem;

type MedicalForm = {
  jenisTindakan: string;
  date: string;
  catatan: string;
};

type ActivityForm = {
  kategori: ActivityInput["kategori"];
  date: string;
  type: string;
  detail: string;
  petugas: string;
  beratBadan: string;
  jenisTindakan: string;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

const selectClassName = inputClassName;

const emptyMedicalForm = (): MedicalForm => ({
  jenisTindakan: "Obat_Cacing",
  date: new Date().toISOString().split("T")[0],
  catatan: "",
});

const emptyActivityForm = (): ActivityForm => ({
  kategori: "perawatan",
  date: new Date().toISOString().split("T")[0],
  type: "",
  detail: "",
  petugas: "Tim Peternakan",
  beratBadan: "",
  jenisTindakan: "Obat_Cacing",
});

const today = new Date().toISOString().split("T")[0];

function extractActivityDetail(detail: string): string {
  const parts = detail.split(" — ");
  return parts.length > 1 ? parts.slice(1).join(" — ") : "";
}

export default function CattleProfilePage() {
  const params = useParams();
  const router = useRouter();
  const cattleId = params.id as string;

  const [cattle, setCattle] = useState<Cattle | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [activities, setActivities] = useState<CattleActivity[]>([]);
  const [sensorData, setSensorData] = useState<CattleSensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "medical" | "activity">("overview");

  const [medicalModalMode, setMedicalModalMode] = useState<"create" | "edit" | null>(null);
  const [editingMedical, setEditingMedical] = useState<MedicalRecord | null>(null);
  const [deletingMedical, setDeletingMedical] = useState<MedicalRecord | null>(null);
  const [medicalForm, setMedicalForm] = useState<MedicalForm>(emptyMedicalForm);

  const [activityModalMode, setActivityModalMode] = useState<"create" | "edit" | null>(null);
  const [editingActivity, setEditingActivity] = useState<CattleActivity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<CattleActivity | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityForm>(emptyActivityForm);

  const tabs = [
    { key: "overview", label: "Ringkasan" },
    { key: "medical", label: "Riwayat Medis" },
    { key: "activity", label: "Aktivitas" },
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

  const reloadDetail = async () => {
    const detail = await fetchDetail(cattleId);
    setCattle(detail.cattle);
    setSensorData(detail.sensorData);
    setMedicalRecords(detail.medicalHistory);
    setActivities(detail.cattleActivityLog);
  };

  const fetchAllData = useCallback(async () => {
    try {
      const detail = await fetchDetail(cattleId);
      setCattle(detail.cattle);
      setSensorData(detail.sensorData);
      setMedicalRecords(detail.medicalHistory);
      setActivities(detail.cattleActivityLog);
    } catch {
      setCattle(null);
    } finally {
      setLoading(false);
    }
  }, [cattleId]);

  useEffect(() => {
    fetchAllData();

    const refreshInterval = setInterval(() => {
      if (!medicalModalMode && !activityModalMode && !deletingMedical && !deletingActivity) {
        fetchAllData();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchAllData, medicalModalMode, activityModalMode, deletingMedical, deletingActivity]);

  const openCreateMedical = () => {
    setMedicalModalMode("create");
    setEditingMedical(null);
    setMedicalForm(emptyMedicalForm());
  };

  const openEditMedical = (record: MedicalRecord) => {
    setMedicalModalMode("edit");
    setEditingMedical(record);
    setMedicalForm({
      jenisTindakan: record.jenisTindakan,
      date: record.date,
      catatan: record.catatan,
    });
  };

  const closeMedicalModal = () => {
    setMedicalModalMode(null);
    setEditingMedical(null);
  };

  const handleSaveMedical = async () => {
    if (!medicalForm.date) {
      swalError("Peringatan", "Tanggal wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const payload: MedicalRecordInput = {
        jenisTindakan: medicalForm.jenisTindakan as MedicalRecordInput["jenisTindakan"],
        date: medicalForm.date,
        catatan: medicalForm.catatan,
      };

      if (medicalModalMode === "create") {
        const res = await fetch(`/api/sapi/${encodeURIComponent(cattleId)}/medis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { record?: MedicalRecord; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal menambahkan riwayat medis");
        setMedicalRecords((prev) => [json.record!, ...prev]);
        await reloadDetail();
        swalSuccess("Berhasil", "Riwayat medis berhasil ditambahkan");
      } else if (medicalModalMode === "edit" && editingMedical) {
        const res = await fetch(
          `/api/sapi/${encodeURIComponent(cattleId)}/medis/${encodeURIComponent(editingMedical.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const json = (await res.json()) as { record?: MedicalRecord; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal memperbarui riwayat medis");
        setMedicalRecords((prev) =>
          prev.map((item) => (item.id === editingMedical.id ? json.record! : item))
        );
        await reloadDetail();
        swalSuccess("Berhasil", "Riwayat medis berhasil diperbarui");
      }

      closeMedicalModal();
    } catch (err) {
      swalError("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedical = async () => {
    if (!deletingMedical) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/sapi/${encodeURIComponent(cattleId)}/medis/${encodeURIComponent(deletingMedical.id)}`,
        { method: "DELETE" }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus riwayat medis");

      setMedicalRecords((prev) => prev.filter((item) => item.id !== deletingMedical.id));
      await reloadDetail();
      swalSuccess("Berhasil", "Riwayat medis berhasil dihapus");
      setDeletingMedical(null);
    } catch (err) {
      swalError("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const openCreateActivity = () => {
    setActivityModalMode("create");
    setEditingActivity(null);
    setActivityForm(emptyActivityForm());
  };

  const openEditActivity = (activity: CattleActivity) => {
    setActivityModalMode("edit");
    setEditingActivity(activity);
    setActivityForm({
      kategori: activity.kategori as ActivityForm["kategori"],
      date: activity.date,
      type: activity.type,
      detail:
        activity.source === "medis"
          ? extractActivityDetail(activity.detail)
          : activity.source === "maintenance"
            ? activity.detail
            : extractActivityDetail(activity.detail),
      petugas: activity.petugas,
      beratBadan: activity.beratBadan ? String(activity.beratBadan) : "",
      jenisTindakan: activity.jenisTindakan ?? "Obat_Cacing",
    });
  };

  const closeActivityModal = () => {
    setActivityModalMode(null);
    setEditingActivity(null);
  };

  const buildActivityPayload = (): ActivityInput => {
    const berat = Number(activityForm.beratBadan);
    return {
      kategori: activityForm.kategori,
      date: activityForm.date,
      type: activityForm.type.trim() || undefined,
      detail: activityForm.detail.trim() || undefined,
      petugas: activityForm.petugas.trim() || undefined,
      jenisTindakan: activityForm.jenisTindakan as ActivityInput["jenisTindakan"],
      ...(Number.isFinite(berat) && berat > 0 ? { beratBadan: berat } : {}),
    };
  };

  const handleSaveActivity = async () => {
    if (!activityForm.date) {
      swalError("Peringatan", "Tanggal wajib diisi");
      return;
    }

    if (
      activityForm.kategori === "pencatatan_bobot" &&
      (!activityForm.beratBadan || Number(activityForm.beratBadan) <= 0)
    ) {
      swalError("Peringatan", "Berat badan wajib diisi untuk pencatatan bobot");
      return;
    }

    setSaving(true);
    try {
      const payload = buildActivityPayload();

      if (activityModalMode === "create") {
        const res = await fetch(`/api/sapi/${encodeURIComponent(cattleId)}/aktivitas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { activity?: CattleActivity; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal menambahkan aktivitas");
        await reloadDetail();
        swalSuccess("Berhasil", "Aktivitas berhasil ditambahkan");
      } else if (activityModalMode === "edit" && editingActivity) {
        const res = await fetch(
          `/api/sapi/${encodeURIComponent(cattleId)}/aktivitas/${encodeURIComponent(editingActivity.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const json = (await res.json()) as { activity?: CattleActivity; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal memperbarui aktivitas");
        await reloadDetail();
        swalSuccess("Berhasil", "Aktivitas berhasil diperbarui");
      }

      closeActivityModal();
    } catch (err) {
      swalError("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/sapi/${encodeURIComponent(cattleId)}/aktivitas/${encodeURIComponent(deletingActivity.id)}`,
        { method: "DELETE" }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus aktivitas");

      await reloadDetail();
      swalSuccess("Berhasil", "Aktivitas berhasil dihapus");
      setDeletingActivity(null);
    } catch (err) {
      swalError("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!cattle) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-12 text-center">
          <p className="text-stone-400">Sapi dengan ID {cattleId} tidak ditemukan</p>
          <button onClick={() => router.back()} className="mt-4 flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
            <FaArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
          <p className="text-stone-400 text-sm">{cattle.breed}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={"px-3 py-1 rounded-full text-sm font-medium " + (cattleHealthColors[cattle.health] ?? cattleHealthColors.Sehat)}>
            {cattle.health}
          </span>
          <span className={"px-3 py-1 rounded-full text-sm font-medium " + (statusColors[cattle.status] ?? statusColors.Individu)}>
            {formatKandangLabel(cattle.status)}
          </span>
        </div>
      </div>

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

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Informasi Dasar</h3>
            <div className="space-y-4">
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
                <p className="font-medium text-stone-800 dark:text-stone-100">{formatKandangLabel(cattle.status)}</p>
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

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6 lg:col-span-3">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">Riwayat Suhu Sensor</h3>
            {sensorData?.historicalReadings && sensorData.historicalReadings.length > 0 ? (
              <div className="space-y-2">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={sensorData.historicalReadings.slice(-20).map((r, idx) => ({
                      label: `${idx + 1}`,
                      core: r.core_temperature,
                      ear: r.ear_temperature,
                      time: r.timestamp
                    }))}
                    margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeOpacity={0.6} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#a8a29e" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e7e5e4" }}
                    />
                    <YAxis
                      domain={[35, 42]}
                      tick={{ fontSize: 10, fill: "#a8a29e" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}°`}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value}°C`, name === 'core' ? 'Suhu Core' : 'Suhu Telinga']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.time || label}
                    />
                    <ReferenceLine
                      y={40}
                      stroke="#ef4444"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{ value: "Demam >40°C", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
                    />
                    <ReferenceLine
                      y={36}
                      stroke="#10b981"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{ value: "36°C", fill: "#10b981", fontSize: 10, position: "insideBottomRight" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="core"
                      name="Suhu Core"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="ear"
                      name="Suhu Telinga"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-stone-500">Suhu Core</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs text-stone-500">Suhu Telinga</span>
                  </div>
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

      {activeTab === "medical" && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">Riwayat Medis</h3>
            <button
              type="button"
              onClick={openCreateMedical}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]"
            >
              <FaPlus className="h-4 w-4" />
              Tambah riwayat
            </button>
          </div>
          <div className="space-y-3">
            {medicalRecords.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Belum ada riwayat medis untuk sapi ini</p>
            ) : (
              medicalRecords.map((record) => (
                <div key={record.id} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="mt-0.5">
                    <FaStethoscope className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{record.type}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{record.description}</p>
                    <p className="text-xs text-stone-400 mt-1">{record.date} {record.vet}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={"text-xs px-2 py-0.5 rounded-full " + (
                      record.status === "Selesai"
                        ? "bg-[#e5d7c4]/30 dark:bg-[#354024]/30 text-[#54cd19] dark:text-[#889063]"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    )}>
                      {record.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditMedical(record)}
                      className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-200 hover:text-[#54cd19] dark:hover:bg-stone-700"
                      title="Edit"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingMedical(record)}
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-950/40"
                      title="Hapus"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">Log Aktivitas</h3>
            <button
              type="button"
              onClick={openCreateActivity}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]"
            >
              <FaPlus className="h-4 w-4" />
              Tambah aktivitas
            </button>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Belum ada data aktivitas untuk sapi ini</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                      <span className="font-medium text-stone-700 dark:text-stone-300">{activity.date}</span>
                      <span>·</span>
                      <span>{activity.petugas}</span>
                      <span>·</span>
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                        {activity.kategori.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-stone-700 dark:text-stone-300">{activity.type}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{activity.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditActivity(activity)}
                      className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-200 hover:text-[#54cd19] dark:hover:bg-stone-700"
                      title="Edit"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingActivity(activity)}
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-950/40"
                      title="Hapus"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={medicalModalMode !== null}
        onClose={closeMedicalModal}
        title={medicalModalMode === "create" ? "Tambah Riwayat Medis" : "Edit Riwayat Medis"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Jenis Tindakan
            </label>
            <select
              value={medicalForm.jenisTindakan}
              onChange={(event) =>
                setMedicalForm((current) => ({ ...current, jenisTindakan: event.target.value }))
              }
              className={selectClassName}
            >
              <option value="Obat_Cacing">Obat Cacing</option>
              <option value="Vaksin_PMK">Vaksin PMK</option>
              <option value="Vaksin_LSD">Vaksin LSD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Tanggal
            </label>
            <input
              type="date"
              value={medicalForm.date}
              onChange={(event) =>
                setMedicalForm((current) => ({ ...current, date: event.target.value }))
              }
              className={inputClassName}
              max={today}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Catatan
            </label>
            <textarea
              value={medicalForm.catatan}
              onChange={(event) =>
                setMedicalForm((current) => ({ ...current, catatan: event.target.value }))
              }
              rows={3}
              className={inputClassName}
              placeholder="Contoh: Vaksin PMK ke-9"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeMedicalModal}
              disabled={saving}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveMedical}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117] disabled:opacity-50"
            >
              {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deletingMedical)}
        onClose={() => !saving && setDeletingMedical(null)}
        title="Hapus Riwayat Medis"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Hapus riwayat medis tanggal{" "}
            <span className="font-semibold">{deletingMedical?.date}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingMedical(null)}
              disabled={saving}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteMedical}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
              Hapus
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activityModalMode !== null}
        onClose={closeActivityModal}
        title={activityModalMode === "create" ? "Tambah Aktivitas" : "Edit Aktivitas"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Kategori
            </label>
            <select
              value={activityForm.kategori}
              onChange={(event) =>
                setActivityForm((current) => ({
                  ...current,
                  kategori: event.target.value as ActivityForm["kategori"],
                }))
              }
              disabled={activityModalMode === "edit"}
              className={selectClassName}
            >
              <option value="pemeriksaan">Pemeriksaan Medis</option>
              <option value="pencatatan_bobot">Pencatatan Bobot</option>
              <option value="perawatan">Perawatan</option>
              <option value="vaksinasi">Vaksinasi</option>
            </select>
          </div>

          {activityForm.kategori === "pemeriksaan" && (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Jenis Tindakan Medis
              </label>
              <select
                value={activityForm.jenisTindakan}
                onChange={(event) =>
                  setActivityForm((current) => ({ ...current, jenisTindakan: event.target.value }))
                }
                className={selectClassName}
              >
                <option value="Obat_Cacing">Obat Cacing</option>
                <option value="Vaksin_PMK">Vaksin PMK</option>
                <option value="Vaksin_LSD">Vaksin LSD</option>
              </select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Tanggal
              </label>
              <input
                type="date"
                value={activityForm.date}
                onChange={(event) =>
                  setActivityForm((current) => ({ ...current, date: event.target.value }))
                }
                className={inputClassName}
                max={today}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Petugas
              </label>
              <input
                value={activityForm.petugas}
                onChange={(event) =>
                  setActivityForm((current) => ({ ...current, petugas: event.target.value }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          {activityForm.kategori !== "pencatatan_bobot" && (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Jenis Aktivitas
              </label>
              <input
                value={activityForm.type}
                onChange={(event) =>
                  setActivityForm((current) => ({ ...current, type: event.target.value }))
                }
                className={inputClassName}
                placeholder="Contoh: Perawatan kandang"
              />
            </div>
          )}

          {activityForm.kategori === "pencatatan_bobot" && (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Berat (kg)
              </label>
              <input
                type="number"
                min="0"
                value={activityForm.beratBadan}
                onChange={(event) =>
                  setActivityForm((current) => ({ ...current, beratBadan: event.target.value }))
                }
                className={inputClassName}
                placeholder="Contoh: 520"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Detail / Catatan
            </label>
            <textarea
              value={activityForm.detail}
              onChange={(event) =>
                setActivityForm((current) => ({ ...current, detail: event.target.value }))
              }
              rows={3}
              className={inputClassName}
              placeholder="Catatan tambahan aktivitas"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeActivityModal}
              disabled={saving}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveActivity}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117] disabled:opacity-50"
            >
              {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deletingActivity)}
        onClose={() => !saving && setDeletingActivity(null)}
        title="Hapus Aktivitas"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Hapus aktivitas{" "}
            <span className="font-semibold">{deletingActivity?.type}</span> tanggal{" "}
            <span className="font-semibold">{deletingActivity?.date}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingActivity(null)}
              disabled={saving}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteActivity}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
