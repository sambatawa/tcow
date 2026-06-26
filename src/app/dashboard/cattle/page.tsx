"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FaSpinner, FaExclamationTriangle, FaPlus, FaDownload, FaTrash, FaEye } from "react-icons/fa";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import type { CattleInput, CattleListItem } from "@/lib/sapi";
import { formatKandangLabel } from "@/lib/sapi";
import { cattleHealthColors, inputClassName } from "@/lib/styles";
import { useReadOnly } from "@/context/ReadOnlyContext";

type CattleForm = {
  name: string;
  breed: string;
  gender: string;
  kandang: string;
  birthDate: string;
  health: string;
  weight: string;
  lastCheck: string;
  eartag: string;
};

const emptyForm = (): CattleForm => ({
  name: "",
  breed: "",
  gender: "Betina",
  kandang: "KoloniBesar",
  birthDate: new Date().toISOString().split("T")[0],
  health: "Sehat",
  weight: "",
  lastCheck: new Date().toISOString().split("T")[0],
  eartag: "",
});

const today = new Date().toISOString().split("T")[0];

function formToPayload(form: CattleForm): CattleInput {
  const weight = Number(form.weight);
  return {
    name: form.name.trim(),
    breed: form.breed.trim(),
    gender: form.gender as CattleInput["gender"],
    kandang: form.kandang as CattleInput["kandang"],
    birthDate: form.birthDate,
    health: form.health as CattleInput["health"],
    lastCheck: form.lastCheck,
    eartag: form.eartag.trim() || undefined,
    ...(Number.isFinite(weight) && weight > 0 ? { weight } : {}),
  };
}

export default function CattleListPage() {
  const { isReadOnly } = useReadOnly();
  const [cattle, setCattle] = useState<CattleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCattle, setEditingCattle] = useState<CattleListItem | null>(null);
  const [deletingCattle, setDeletingCattle] = useState<CattleListItem | null>(null);
  const [form, setForm] = useState<CattleForm>(emptyForm);

  const fetchCattle = useCallback(async () => {
    try {
      const res = await fetch("/api/sapi", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat data sapi");
      const json = (await res.json()) as { cattle: CattleListItem[] };
      setCattle(json.cattle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchCattle();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Auto-refresh setiap 30 detik
    const refreshInterval = setInterval(() => {
      if (!modalMode) {
        fetchCattle();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, [fetchCattle, modalMode]);

  const handleFormChange = (key: keyof CattleForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingCattle(null);
    setForm(emptyForm());
  };

  const openEditModal = (item: CattleListItem) => {
    setModalMode("edit");
    setEditingCattle(item);
    setForm({
      name: item.name,
      breed: item.breed,
      gender: item.gender,
      kandang: item.status,
      birthDate: item.birthDate,
      health: item.health,
      weight: String(item.weight || ""),
      lastCheck: item.lastCheck,
      eartag: item.eartag ?? "",
    });
  };

  const closeFormModal = () => {
    setModalMode(null);
    setEditingCattle(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.breed.trim()) {
      toast.error("Nama dan jenis sapi wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);

      if (modalMode === "create") {
        const res = await fetch("/api/sapi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { cattle?: CattleListItem; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal menambahkan sapi");
        setCattle((prev) => [...prev, json.cattle!].sort((a, b) => a.idsapi - b.idsapi));
        toast.success("Sapi berhasil ditambahkan");
      } else if (modalMode === "edit" && editingCattle) {
        const res = await fetch(`/api/sapi/${encodeURIComponent(editingCattle.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { cattle?: CattleListItem; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal memperbarui sapi");
        setCattle((prev) =>
          prev.map((item) => (item.id === editingCattle.id ? json.cattle! : item))
        );
        toast.success("Data sapi berhasil diperbarui");
      }

      closeFormModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCattle) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/sapi/${encodeURIComponent(deletingCattle.id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus sapi");

      setCattle((prev) => prev.filter((item) => item.id !== deletingCattle.id));
      toast.success("Sapi berhasil dihapus");
      setDeletingCattle(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!cattle.length) {
      toast.error("Tidak ada data sapi untuk diekspor");
      return;
    }

    const rows = [[ "ID Sapi", "Nama", "Jenis", "Jenis Kelamin", "Kandang", "Status Kesehatan", "Berat (kg)", "Terakhir diperiksa"],
      ...cattle.map((item) => [
        item.id,
        item.name,
        item.breed,
        item.gender,
        item.status,
        item.health,
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

  if (loading) {
    return (
      <div className="p-6 min-h-[40vh] flex items-center justify-center gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
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
      <div className="w-full">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Manajemen Sapi</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Mengelola data setiap sapi yang ada dalam peternakan T-Cow.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#54cd19] hover:bg-[#e7f6d7] dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200">
              <FaDownload className="h-3 w-3" />
              <p className="hidden lg:block">Export data</p>
            </button>
            {!isReadOnly && (
              <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]">
                <FaPlus className="h-3 w-3" />
                <p className="hidden lg:block">Tambah sapi</p>
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                  <h3 className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {item.breed} {formatKandangLabel(item.status)}
                  </p>
                </div>
                <div className={"rounded-2xl px-3 py-1 text-sm font-medium " + (cattleHealthColors[item.health] ?? cattleHealthColors.Sehat)}>
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
                  <Link href={`/dashboard/cattle/${item.id}`} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-[#54cd19] hover:bg-[#e7f6d7] dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200">
                    Lihat detail
                  </Link>
                  {!isReadOnly && (
                    <>
                      <button type="button" onClick={() => openEditModal(item)} className="inline-flex items-center gap-2 rounded-full border border-[#54cd19] bg-[#54cd19] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]">
                        Edit
                      </button>
                      <button type="button" onClick={() => setDeletingCattle(item)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
                        >
                        <FaTrash className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={modalMode !== null}
        onClose={closeFormModal}
        title={
          modalMode === "create"
            ? "Tambah Sapi Baru"
            : editingCattle
              ? `Edit ${editingCattle.name}`
              : "Edit Sapi"
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Nama
            </label>
            <input
              value={form.name}
              onChange={(event) => handleFormChange("name", event.target.value)}
              className={inputClassName}
              placeholder="Nama sapi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Jenis
            </label>
            <input
              value={form.breed}
              onChange={(event) => handleFormChange("breed", event.target.value)}
              className={inputClassName}
              placeholder="Contoh: Lokal, Friesian"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Jenis Kelamin
              </label>
              <select
                value={form.gender}
                onChange={(event) => handleFormChange("gender", event.target.value)}
                className={inputClassName}
              >
                <option value="Betina">Betina</option>
                <option value="Jantan">Jantan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Kandang
              </label>
              <select
                value={form.kandang}
                onChange={(event) => handleFormChange("kandang", event.target.value)}
                className={inputClassName}
              >
                <option value="Individu">Individu</option>
                <option value="KandangDara">Kandang Dara</option>
                <option value="KoloniBesar">Koloni Besar</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Kesehatan
              </label>
              <select
                value={form.health}
                onChange={(event) => handleFormChange("health", event.target.value)}
                className={inputClassName}
              >
                <option value="Sehat">Sehat</option>
                <option value="Sakit">Sakit</option>
                <option value="Mati">Mati</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) => handleFormChange("birthDate", event.target.value)}
                className={inputClassName}
                max={today}
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
                min="0"
                value={form.weight}
                onChange={(event) => handleFormChange("weight", event.target.value)}
                className={inputClassName}
                placeholder="Contoh: 520"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Terakhir diperiksa
              </label>
              <input
                type="date"
                value={form.lastCheck}
                onChange={(event) => handleFormChange("lastCheck", event.target.value)}
                className={inputClassName}
                max={today}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Nomor Eartag
            </label>
            <input
              value={form.eartag}
              onChange={(event) => handleFormChange("eartag", event.target.value)}
              className={inputClassName}
              placeholder="Nomor identifikasi sapi"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={saving}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117] disabled:opacity-50"
            >
              {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
              {modalMode === "create" ? "Tambah" : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deletingCattle)}
        onClose={() => !saving && setDeletingCattle(null)}
        title="Hapus Sapi"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Apakah Anda yakin ingin menghapus sapi{" "}
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {deletingCattle?.name} ({deletingCattle?.id})
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletingCattle(null)}
              disabled={saving}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
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
