"use client";

import { useState, useEffect, useCallback } from "react";
import { FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaSpinner, FaTimes, FaCheck, FaUserPlus } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type User = {
  uid: string;
  name: string;
  email: string;
  role: string;
  farm: string;
  status: string;
  lastLogin: string;
  createdAt: string;
};

type FormData = {
  uid: string;
  name: string;
  email: string;
  role: string;
  alamat: string;
};

const roleColors: Record<string, string> = {
  Teknisi: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  Peternak: "bg-[#cfbb99]/30 dark:bg-[#354024]/30 text-[#354024] dark:text-[#e5d7c4]",
};

const statusColors: Record<string, string> = {
  Aktif: "bg-[#54cd19]/20 dark:bg-[#54cd19]/20 text-[#54cd19] dark:text-[#54cd19]",
  Nonaktif: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
};

const inputClassName = "mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [usersData, setUsersData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    uid: "",
    name: "",
    email: "",
    role: "Peternak",
    alamat: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/pengguna", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setUsersData(json.usersData ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Auto-refresh setiap 30 detik
    const refreshInterval = setInterval(() => {
      if (!showModal) {
        fetchUsers();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchUsers, showModal]);

  const filtered = usersData.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = usersData.filter((u) => u.status === "Aktif").length;
  const teknisiCount = usersData.filter((u) => u.role === "Teknisi").length;
  const peternakCount = usersData.filter((u) => u.role === "Peternak").length;

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      uid: "",
      name: "",
      email: "",
      role: "Peternak",
      alamat: "",
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setFormData({
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      alamat: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (modalMode === "add") {
        const uid = `${formData.role === "Teknisi" ? "TKN" : "PTR"}${String(usersData.length + 1).padStart(3, "0")}`;
        const res = await fetch("/api/pengguna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            uid,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            firebase_uid: `manual-${uid}`,
            alamat: formData.alamat,
          }),
        });

        if (res.ok) {
          toast.success("Pengguna berhasil ditambahkan");
          setShowModal(false);
          fetchUsers();
        } else {
          const data = await res.json();
          toast.error(data.error || "Gagal menambahkan pengguna");
        }
      } else {
        const res = await fetch("/api/pengguna", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            uid: formData.uid,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            alamat: formData.alamat,
          }),
        });

        if (res.ok) {
          toast.success("Pengguna berhasil diperbarui");
          setShowModal(false);
          fetchUsers();
        } else {
          const data = await res.json();
          toast.error(data.error || "Gagal memperbarui pengguna");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/pengguna?uid=${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Pengguna berhasil dihapus");
        setDeleteId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus pengguna");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["UID", "Nama", "Email", "Role", "Status", "Terakhir Login", "Tanggal Bergabung"],
      ...filtered.map((u) => [
        u.uid,
        u.name,
        u.email,
        u.role,
        u.status,
        u.lastLogin,
        new Date(u.createdAt).toLocaleDateString("id-ID"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `data_pengguna_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Data berhasil diekspor");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
        Memuat data...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-1 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full">
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Manajemen Pengguna</h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Kelola akun dan hak akses pengguna sistem</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#54cd19] hover:bg-[#e7f6d7] dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200"
              >
                <FaDownload className="h-3 w-3" />
                <span className="hidden lg:block">Export</span>
              </button>
              {currentUser?.role === "Teknisi" && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117]"
                >
                  <FaPlus className="h-3 w-3" />
                  <span className="hidden lg:block">Tambah</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
          <p className="text-sm text-stone-500 dark:text-stone-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-stone-800 dark:text-stone-100">{usersData.length}</p>
        </div>
        <div className="rounded-2xl border border-[#54cd19]/30 bg-[#54cd19]/10 p-4 dark:border-[#54cd19]/20 dark:bg-[#54cd19]/5">
          <p className="text-sm text-[#54cd19] dark:text-[#54cd19]">Aktif</p>
          <p className="mt-1 text-2xl font-bold text-[#354024] dark:text-[#54cd19]">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">Teknisi</p>
          <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{teknisiCount}</p>
        </div>
        <div className="rounded-2xl border border-[#cfbb99]/30 bg-[#cfbb99]/20 p-4 dark:border-[#354024]/30 dark:bg-[#354024]/20">
          <p className="text-sm text-[#354024] dark:text-[#cfbb99]">Peternak</p>
          <p className="mt-1 text-2xl font-bold text-[#354024] dark:text-[#e5d7c4]">{peternakCount}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950 overflow-hidden">
        <div className="border-b border-stone-200 p-4 dark:border-stone-800">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-2 text-sm text-stone-900 outline-none transition focus:border-[#54cd19] focus:ring-2 focus:ring-[#54cd19]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Pengguna
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Bergabung
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Terakhir Login
                </th>
                {currentUser?.role === "Teknisi" && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentUser?.role === "Teknisi" ? 6 : 5}
                    className="px-4 py-8 text-center text-stone-400"
                  >
                    Tidak ada pengguna yang ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.uid}
                    className="transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${roleColors[user.role] || ""}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-200">{user.name}</p>
                          <p className="text-xs text-stone-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[user.role] || ""}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[user.status] || ""}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {user.lastLogin}
                    </td>
                    {currentUser?.role === "Teknisi" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-stone-600 transition hover:border-[#54cd19] hover:bg-[#e7f6d7] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                            title="Edit"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          {currentUser.uid !== user.uid && (
                            <button
                              onClick={() => setDeleteId(user.uid)}
                              className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
                              title="Hapus"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 p-4 dark:border-stone-700">
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                {modalMode === "add" ? "Tambah Pengguna" : "Edit Pengguna"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:text-stone-400"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClassName}
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClassName}
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={inputClassName}
                >
                  <option value="Peternak">Peternak</option>
                  <option value="Teknisi">Teknisi</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-[#54cd19] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#47b117] disabled:opacity-50"
                >
                  {submitting ? (
                    <FaSpinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <FaCheck className="h-4 w-4" />
                  )}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-stone-900">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FaTrash className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-800 dark:text-stone-100">
                Hapus Pengguna?
              </h3>
              <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                Tindakan ini tidak dapat dibatalkan. Semua data pengguna akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? <FaSpinner className="h-4 w-4 animate-spin" /> : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
