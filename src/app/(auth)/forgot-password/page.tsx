"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaEnvelope,
  FaSpinner,
  FaCheckCircle,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { glassBlock, lbl, inputClass, buttonClass } from "@/lib/styles";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { PasswordChecksList } from "@/components/auth/PasswordChecksList";
import { apiPost } from "@/lib/api-client";
import {
  getPasswordChecks,
  isPasswordValid,
  isValidEmailFormat,
  MSG,
  normalizeEmail,
} from "@/lib/validation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = getPasswordChecks(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError(MSG.emailRequired);
    if (!isValidEmailFormat(email)) return setError(MSG.emailInvalid);
    if (!isPasswordValid(password)) return setError(MSG.passwordInvalid);
    if (password !== confirm) return setError(MSG.passwordMismatch);

    setError("");
    setLoading(true);

    const result = await apiPost("/api/auth/forgot-password", {
      email: normalizeEmail(email),
      password,
      confirmPassword: confirm,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  };

  if (done) {
    return (
      <div className="text-center space-y-7 px-2">
        <div className="mx-auto flex h-17 w-17 items-center justify-center rounded-2xl border border-brand-forest/15 bg-brand-accent-soft dark:bg-brand-forest/50 backdrop-blur-md">
          <FaCheckCircle className="h-9 w-9 text-brand-forest dark:text-brand-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-forest dark:text-brand-cream">
            Password berhasil diubah
          </h1>
          <p className="mt-3 text-sm text-brand-sage dark:text-brand-tan">
            Mengalihkan ke halaman masuk...
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block rounded-2xl bg-brand-forest dark:bg-brand-sage px-8 py-3.5 text-sm font-semibold text-brand-cream"
        >
          Masuk sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-brand-forest dark:text-brand-cream text-2xl font-bold tracking-tight">
          Reset password
        </h1>
        <p className="text-brand-sage dark:text-brand-tan/90 mt-2 text-sm leading-relaxed">
          Masukkan email akun dan password baru Anda.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthErrorBanner message={error} />

        <div className={glassBlock}>
          <label className={lbl} htmlFor="forgot-email">
            Email akun
          </label>
          <div className="relative flex items-center gap-3">
            <FaEnvelope className="w-5 h-5 shrink-0 text-brand-sage dark:text-brand-tan opacity-75" />
            <input
              className={`${inputClass} flex-1 min-w-0`}
              placeholder="nama@gmail.com"
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className={glassBlock}>
          <label className={lbl} htmlFor="new-password">
            Password baru
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="Min. 5 karakter"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-brand-sage hover:text-brand-forest dark:text-brand-tan"
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={glassBlock}>
          <label className={lbl} htmlFor="confirm-password">
            Konfirmasi password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="Ulangi password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-brand-sage hover:text-brand-forest dark:text-brand-tan"
            >
              {showConfirm ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {password && <PasswordChecksList checks={passwordChecks} />}

        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <FaSpinner className="w-4 h-4 animate-spin" />
              Menyimpan...
            </span>
          ) : (
            "Simpan password baru"
          )}
        </button>
      </form>

      <p className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-brand-sage hover:text-brand-forest dark:text-brand-tan dark:hover:text-brand-cream transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          Kembali ke masuk
        </Link>
      </p>
    </div>
  );
}
