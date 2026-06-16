"use client";

import { useState, useEffect } from "react";
import { FaUsers, FaPlus, FaEdit, FaTrash, FaShieldAlt, FaEye, FaSearch, FaUserCheck, FaDownload, FaSpinner } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

const roleStyle: Record<string, string> = {
  Teknisi: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  Peternak: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Viewer: "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400",
};

const statusStyle: Record<string, string> = {
  Aktif: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  Nonaktif: "bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400",
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  farm: string;
  status: string;
  lastLogin: string;
  joinDate: string;
};

export default function AdminPage() {
  const [usersData, setUsersData] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    role: "Operator",
    status: "Aktif",
    joinDate: "",
  });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pengguna");
        if (res.ok) {
          const json = (await res.json()) as { usersData: AdminUser[] };
          setUsersData(json.usersData ?? []);
        }
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const filtered = usersData.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = usersData.filter((u) => u.status === "Aktif").length;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pengguna berhasil ditambahkan");
    setShowAddModal(false);
    setFormData({
      id: "",
      name: "",
      email: "",
      role: "Operator",
      status: "Aktif",
      joinDate: "",
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Nama", "Email", "Role", "Status", "Tanggal Bergabung"],
      ...filtered.map(u => [
        u.id, u.name, u.email, u.role, u.status, u.joinDate
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `data_pengguna_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Data pengguna berhasil diekspor");
  };

  if (loadingUsers) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] gap-3 text-stone-500">
        <FaSpinner className="w-6 h-6 animate-spin" />
        Memuat data pengguna...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
            Teknisi & Manajemen Pengguna
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Kelola akun dan hak akses pengguna sistem
          </p>
        </div>
        {currentUser?.role === "Teknisi" && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <FaPlus className="w-4 h-4" /> Tambah Pengguna
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors px-4 py-2"
            >
              <FaDownload className="w-4 h-4" /> Ekspor
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pengguna", value: usersData.length, color: "bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300" },
          { label: "Pengguna Aktif", value: activeCount, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
          { label: "Admin", value: usersData.filter((u) => u.role === "Admin").length, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400" },
          { label: "Operator", value: usersData.filter((u) => u.role === "Operator").length, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm mt-0.5 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Permission levels info */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">
          Tingkatan Akses Pengguna
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              role: "Admin",
              icon: FaShieldAlt,
              color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400",
              perms: [
                "Akses penuh semua modul",
                "Manajemen pengguna",
                "Konfigurasi sistem",
                "Ekspor & laporan",
              ],
            },
            {
              role: "Operator",
              icon: FaUserCheck,
              color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400",
              perms: [
                "Kelola data sapi",
                "Input pakan & produksi",
                "Maintenance sensor",
                "Lihat laporan",
              ],
            },
            {
              role: "Viewer",
              icon: FaEye,
              color: "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400",
              perms: [
                "Lihat data sapi",
                "Lihat dashboard",
                "Lihat laporan",
              ],
            },
          ].map((role) => (
            <div key={role.role} className={`rounded-xl p-4 ${role.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <role.icon className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">{role.role}</p>
                  <p className="text-xs text-stone-400">Level {role.role}</p>
                </div>
              </div>
              <div className="space-y-1">
                {role.perms.map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />
                    <span className="text-stone-600 dark:text-stone-300">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-12 text-center">
            <FaUsers className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-400">Tidak ada pengguna yang ditemukan</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FaUsers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">{user.name}</h3>
                    <p className="text-xs text-stone-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyle[user.role]}`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[user.status]}`}>
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-400">ID Pengguna</p>
                  <p className="font-medium text-stone-700 dark:text-stone-300">{user.id}</p>
                </div>
                <div>
                  <p className="text-stone-400">Tanggal Bergabung</p>
                  <p className="font-medium text-stone-700 dark:text-stone-300">{user.joinDate}</p>
                </div>
                <div>
                  <p className="text-stone-400">Terakhir Login</p>
                  <p className="font-medium text-stone-700 dark:text-stone-300">{user.lastLogin}</p>
                </div>
                <div>
                  <p className="text-stone-400">Departemen</p>
                  <p className="font-medium text-stone-700 dark:text-stone-300">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                  <FaEdit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                  <FaTrash className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Pengguna Baru">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">ID Pengguna</label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Contoh: U001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Contoh: Ahmad Fauzi"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Contoh: ahmad@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Admin">Admin</option>
                <option value="Operator">Operator</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tanggal Bergabung</label>
            <input
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
