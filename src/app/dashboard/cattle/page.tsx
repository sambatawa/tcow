"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaSpinner, FaExclamationTriangle, FaPlus, FaDownload } from "react-icons/fa";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import type { CattleListItem } from "@/lib/sapi";

type EditForm = {
  name: string;
  breed: string;
  health: string;
  status: string;
  weight: string;
  lastCheck: string;
};

export default function CattleListPage() {
  const [cattle, setCattle] = useState<CattleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCattle, setEditingCattle] = useState<CattleListItem | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    breed: "",
    health: "",
    status: "",
    weight: "",
    lastCheck: "",
  });

  const openEditModal = (item: CattleListItem) => {
    setEditingCattle(item);
    setEditForm({
      name: item.name,
      breed: item.breed,
      health: item.health,
      status: item.status,
      weight: String(item.weight),
      lastCheck: item.lastCheck,
    });
  };

  const closeEditModal = () => {
    setEditingCattle(null);
  };

  const handleEditChange = (key: keyof EditForm, value: string) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const handleSaveEdit = () => {
    if (!editingCattle) return;

    setCattle((prev) =>
      prev.map((item) =>
        item.id === editingCattle.id
          ? {
              ...item,
              name: editForm.name,
              breed: editForm.breed,
              health: editForm.health,
              status: editForm.status,
              weight: Number(editForm.weight),
              lastCheck: editForm.lastCheck,
            }
          : item
      )
    );

    toast.success("Data sapi berhasil diperbarui");
    closeEditModal();
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/sapi");
        if (!res.ok) throw new Error("Gagal memuat data sapi");
        const json = (await res.json()) as { cattle: CattleListItem[] };
        if (!cancelled) setCattle(json.cattle);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
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
    if (!cattle.length) {
      toast.error("Tidak ada data sapi untuk diekspor");
      return;
    }

    const rows = [
      [
        "ID Sapi",
        "Nama",
        "Jenis",
        "Status Kesehatan",
        "Reproduksi",
        "Berat (kg)",
        "Terakhir diperiksa",
      ],
      ...cattle.map((item) => [
        item.id,
        item.name,
        item.breed,
        item.health,
        item.status,
        String(item.weight),
        item.lastCheck,
      ]),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sapi_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export data sapi berhasil");
  };

  const handleAddCattle = () => {
    toast.info("Fitur tambah sapi belum tersedia di versi saat ini.");
  };

  if (loading) {
    return (
      <div className="p-6 min-h-[40vh] flex items-center justify-center gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
        Memuat daftar sapi...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
            <FaExclamationTriangle className="w-5 h-5" />
            <p className="font-semibold">Tidak dapat memuat data sapi</p>
          </div>
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-1 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Manajemen Sapi
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Mengelola data setiap sapi yang ada dalam peternakan Adyatma Farm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#54cd19] hover:bg-[#e7f6d7] dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200">
            <FaDownload className="h-4 w-4 " />
            <p className="hidden lg:block">Export data</p>
          </button>
          <button type="button" onClick={handleAddCattle} className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]">
            <FaPlus className="h-4 w-4" />
            <p className="hidden lg:block">Tambah sapi</p>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cattle.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-900 p-8 text-center text-stone-500">
            Belum ada data sapi tersedia.
          </div>
        ) : (
          cattle.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[#54cd19] hover:shadow-md dark:border-stone-800 dark:bg-stone-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                    {item.id}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {item.breed} • {item.status}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#e7f6d7] px-3 py-1 text-sm font-medium text-[#2f6d0f] dark:bg-[#214d0e]/30 dark:text-[#d0f5a5]">
                  {item.health}
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-stone-500 dark:text-stone-400">
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-3 dark:bg-stone-900">
                  <span>Umur</span>
                  <span>{item.age} th</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-3 dark:bg-stone-900">
                  <span>Berat</span>
                  <span>{item.weight} kg</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-3 dark:bg-stone-900">
                  <span>Terakhir diperiksa</span>
                  <span>{item.lastCheck}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/cattle/${item.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-[#54cd19] hover:bg-[#e7f6d7] dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
                  >
                    Lihat detail
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#54cd19] bg-[#54cd19] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={Boolean(editingCattle)}
        onClose={closeEditModal}
        title={editingCattle ? `Edit ${editingCattle.name}` : "Edit Sapi"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              ID Sapi
            </label>
            <div className="mt-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
              {editingCattle?.id}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Nama
            </label>
            <input
              value={editForm.name}
              onChange={(event) => handleEditChange("name", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Jenis
            </label>
            <input
              value={editForm.breed}
              onChange={(event) => handleEditChange("breed", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Kesehatan
              </label>
              <input
                value={editForm.health}
                onChange={(event) => handleEditChange("health", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Reproduksi
              </label>
              <input
                value={editForm.status}
                onChange={(event) => handleEditChange("status", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Berat (kg)
              </label>
              <input
                type="number"
                value={editForm.weight}
                onChange={(event) => handleEditChange("weight", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Terakhir diperiksa
              </label>
              <input
                value={editForm.lastCheck}
                onChange={(event) => handleEditChange("lastCheck", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
