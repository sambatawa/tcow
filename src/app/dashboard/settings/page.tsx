"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import type { PenggunaPublic } from "@/lib/pengguna";
import { FaUser as UserIcon, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaShieldAlt, FaKey, FaSave, FaCamera, FaEdit, FaTimes, FaExclamationTriangle, FaExclamationCircle } from "react-icons/fa";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";

type TabId = "profile" | "security" | "farm";

type ProfileForm = {
  name: string;
  email: string;
  alamat: string;
  image: string;
};

function profileFromUser(u: PenggunaPublic): ProfileForm {
  return {
    name: u.name,
    email: u.email,
    alamat: u.alamat ?? "",
    image: u.image ?? "",
  };
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const isTeknisi = user?.role === "Teknisi";
  const roleLabel = isTeknisi ? "Teknisi" : "Peternak";

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const [profile, setProfile] = useState<ProfileForm | null>(() =>
    user ? profileFromUser(user) : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    alamat: "",
    image: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [farmName, setFarmName] = useState("Smart Dairy Farm Jawa Barat");

  const syncFormFromProfile = useCallback((p: NonNullable<typeof profile>) => {
    setFormData((prev) => ({
      ...prev,
      name: p.name,
      email: p.email,
      alamat: p.alamat,
      image: p.image,
    }));
  }, []);

  const applyProfile = useCallback(
    (data: PenggunaPublic, syncAuth = false) => {
      const next = profileFromUser(data);
      setProfile(next);
      syncFormFromProfile(next);
      if (syncAuth) updateUser(data);
    },
    [syncFormFromProfile, updateUser]
  );

  useEffect(() => {
    if (!user?.uid) return;

    applyProfile(user, false);

    let cancelled = false;
    (async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/pengguna/${encodeURIComponent(user.uid)}`);
        if (!res.ok) {
          if (user.email) {
            const byEmail = await fetch(
              `/api/pengguna?email=${encodeURIComponent(user.email)}`
            );
            if (byEmail.ok) {
              const data = (await byEmail.json()) as PenggunaPublic;
              if (!cancelled) applyProfile(data, true);
              return;
            }
          }
          throw new Error("not found");
        }
        const data = (await res.json()) as PenggunaPublic;
        if (!cancelled) applyProfile(data, true);
      } catch {
        if (!cancelled) {
          toast.error(
            "Profil dari database tidak dimuat. Anda tetap bisa mengedit, lalu simpan."
          );
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearImagePreview = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setPendingImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJpeg =
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      /\.jpe?g$/i.test(file.name);

    if (!isJpeg) {
      toast.error("Hanya file JPG/JPEG yang diperizinkan");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2 MB");
      return;
    }

    clearImagePreview();
    setPendingImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    if (profile) syncFormFromProfile(profile);
    clearImagePreview();
    setIsEditing(false);
  };

  const uploadAvatar = async (file: File, uid: string) => {
    const body = new FormData();
    body.append("file", file);
    body.append("uid", uid);
    const res = await fetch("/api/upload/avatar", { method: "POST", body });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        typeof err.error === "string" ? err.error : "Gagal mengunggah foto"
      );
    }
    const { url } = (await res.json()) as { url: string };
    return url;
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (pendingImageFile) {
        imageUrl = await uploadAvatar(pendingImageFile, user.uid);
      }

      const res = await fetch(`/api/pengguna/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          alamat: formData.alamat,
          image: imageUrl,
          email: formData.email,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : "Gagal menyimpan"
        );
      }
      const data = (await res.json()) as PenggunaPublic;
      applyProfile(data, true);
      clearImagePreview();
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Gagal memperbarui profil"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password berhasil diubah!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch {
      toast.error("Gagal mengubah password");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: typeof UserIcon }[] = [
    { id: "profile", label: "Profil", icon: UserIcon },
    { id: "security", label: "Keamanan", icon: FaShieldAlt },
    ...(isTeknisi ? [{ id: "farm" as const, label: "Peternakan", icon: FaBuilding }] : []),
  ];

  const tabBtnClass = (id: TabId) =>
    `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      activeTab === id
        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
        : "border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
    }`;

  return (
    <div className="p-6 max-w-9xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Pengaturan
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          Kelola informasi akun Anda
        </p>
      </div>

      <div className="mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
          <FaShieldAlt className="w-4 h-4" />
          {roleLabel}
        </span>
      </div>

      <div className="border-b border-stone-200 dark:border-stone-700 mb-6 overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={tabBtnClass(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
        {activeTab === "profile" && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <SectionHeader
                title="Informasi Profil"
                description="Perbarui nama, foto, dan alamat Anda"
              />
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={!user?.uid}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shrink-0 disabled:opacity-50"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Profil
                </button>
              ) : (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                    Batal
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <FaSave className="w-4 h-4" />
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              )}
            </div>

            {isFetching && !profile ? (
              <p className="text-sm text-stone-500">Memuat profil...</p>
            ) : (
              <>
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {(imagePreview || formData.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview || formData.image}
                        alt={formData.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {formData.name?.charAt(0) || "U"}
                      </div>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 transition-colors"
                        title="Unggah foto JPG"
                      >
                        <FaCamera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100">
                      {formData.name || "—"}
                    </h3>
                    <p className="text-stone-600 dark:text-stone-400">{roleLabel}</p>
                    {isEditing && (
                      <p className="text-xs text-stone-500 mt-1">
                        Klik ikon kamera untuk unggah foto JPG (maks. 2 MB)
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Alamat
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={2}
                        placeholder="Alamat lengkap"
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="p-6">
            <SectionHeader
              title="Keamanan Akun"
              description="Kelola password dan keamanan akun Anda"
            />
            <div className="space-y-6">
              <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-4">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                  <FaKey className="w-4 h-4" />
                  Ubah Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Password Saat Ini
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={
                      isLoading ||
                      !formData.currentPassword ||
                      !formData.newPassword
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaKey className="w-4 h-4" />
                    {isLoading ? "Mengubah..." : "Ubah Password"}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <FaExclamationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Tips Keamanan
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Gunakan password yang kuat dan unik</li>
                      <li>• Jangan bagikan password Anda kepada siapa pun</li>
                      <li>• Ganti password secara berkala</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "farm" && isTeknisi && (
          <div className="p-6">
            <SectionHeader
              title="Informasi Peternakan"
              description="Detail dan ringkasan peternakan yang Anda kelola"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Nama Peternakan
                </label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Lokasi Peternakan
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value="Jawa Barat, Indonesia"
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
              <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-4">
                Statistik Peternakan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                    Total Sapi
                  </p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    45
                  </p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                    Sapi Sehat
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    42
                  </p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                    Perlu Perhatian
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    3
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
