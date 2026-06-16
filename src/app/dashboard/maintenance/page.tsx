"use client";

import { useState, useEffect } from "react";
import { FaWrench, FaPlus, FaClock, FaCheckCircle, FaExclamationTriangle, FaUser, FaDownload, FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";

const priorityStyle: Record<string, string> = {
  Tinggi: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700",
  Sedang: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  Rendah: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
};

const statusStyle: Record<string, string> = {
  Menunggu: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  "Dalam Proses": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Selesai: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
};

const statusIcons: Record<string, React.ElementType> = {
  Menunggu: FaExclamationTriangle,
  "Dalam Proses": FaClock,
  Selesai: FaCheckCircle,
};

type MaintenanceItem = {
  id: string;
  sensorId: string;
  date: string;
  type: string;
  description: string;
  technician: string;
  status: string;
  priority: string;
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");
  const filters = ["Semua", "Menunggu", "Dalam Proses", "Selesai"];
  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/maintenance");
        if (res.ok) {
          const json = (await res.json()) as { maintenanceData: MaintenanceItem[] };
          setMaintenanceData(json.maintenanceData ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [formData, setFormData] = useState({
    id: "",
    type: "",
    priority: "Sedang",
    sensorId: "",
    date: "",
    technician: "",
    description: "",
  });

  const filtered = maintenanceData.filter(
    (m) => filter === "Semua" || m.status === filter
  );

  const pendingCount = maintenanceData.filter((m) => m.status === "Menunggu").length;
  const inProgressCount = maintenanceData.filter((m) => m.status === "Dalam Proses").length;
  const doneCount = maintenanceData.filter((m) => m.status === "Selesai").length;

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Maintenance berhasil ditambahkan");
    setShowAddModal(false);
    setFormData({
      id: "",
      type: "",
      priority: "Sedang",
      sensorId: "",
      date: "",
      technician: "",
      description: "",
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Tipe", "Prioritas", "Sensor ID", "Tanggal", "Petugas", "Status", "Deskripsi"],
      ...filtered.map(m => [
        m.id, m.type, m.priority, m.sensorId, m.date, m.technician, m.status, m.description
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `data_maintenance_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Data maintenance berhasil diekspor");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
        Memuat data maintenance...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
            Maintenance Sistem
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Kelola perbaikan dan perawatan perangkat sensor
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role && user.role !== "Peternak" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <FaPlus className="w-4 h-4" /> Tambah Maintenance
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors px-4 py-2"
          >
            <FaDownload className="w-4 h-4" /> Ekspor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Menunggu", value: pendingCount, icon: FaExclamationTriangle, color: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" },
          { label: "Dalam Proses", value: inProgressCount, icon: FaClock, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
          { label: "Selesai", value: doneCount, icon: FaCheckCircle, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <s.icon className="w-5 h-5 mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm mt-0.5 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-fit">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Maintenance Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-12 text-center">
            <FaWrench className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-400">Tidak ada data maintenance</p>
          </div>
        ) : (
          filtered.map((item) => {
            const StatusIcon = statusIcons[item.status];
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border ${priorityStyle[item.priority]} p-5`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">{item.type}</h3>
                    <p className="text-stone-400 text-sm">{item.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[item.status]}`}>
                    {item.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Prioritas:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyle[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Lokasi:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">{item.sensorId}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Tanggal:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">{item.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Estimasi:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">{item.priority}</span>
                  </div>

                  <div>
                    <p className="text-sm text-stone-400 mb-1">Deskripsi:</p>
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Petugas:</span>
                    <div className="flex items-center gap-2">
                      <FaUser className="w-4 h-4 text-stone-400" />
                      <span className="font-medium text-stone-700 dark:text-stone-300">{item.technician}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Status:</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4 text-stone-400" />
                      <span className="font-medium text-stone-700 dark:text-stone-300">{item.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">Catatan:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">{item.description || "—"}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Maintenance Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Maintenance Baru">
        <form onSubmit={handleAddMaintenance} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">ID Maintenance</label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Contoh: MNT-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tipe Maintenance</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Contoh: Penggantian Baterai"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Prioritas</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Sensor ID</label>
              <input
                type="text"
                required
                value={formData.sensorId}
                onChange={(e) => setFormData({ ...formData, sensorId: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Contoh: S001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Petugas</label>
              <input
                type="text"
                required
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Contoh: Ahmad"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Deskripsi</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={3}
              placeholder="Deskripsi detail maintenance..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
