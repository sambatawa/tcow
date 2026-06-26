"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { glassBlock, lbl, inputClass, buttonClass } from "@/lib/styles";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { isValidEmailFormat, MSG } from "@/lib/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) return setError(MSG.emailRequired);
    if (!password) return setError(MSG.passwordRequired);
    if (!isValidEmailFormat(email)) return setError(MSG.emailInvalid);

    setLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError("Email atau password salah");
      setLoading(false);
      return;
    }

    toast.success("Berhasil masuk");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-brand-forest dark:text-brand-cream text-2xl font-bold tracking-tight">
          Masuk
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthErrorBanner message={error} />

        <div className={glassBlock}>
          <label className={lbl} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className={inputClass}
          />
        </div>

        <div className={glassBlock}>
          <label className={`${lbl} mb-0`} htmlFor="login-password">
            Password
          </label>
          <div className="relative flex items-center mt-2">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button
              className="absolute right-0 p-1 text-brand-sage hover:text-brand-forest dark:text-brand-tan dark:hover:text-brand-cream"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                <FaEyeSlash className="w-5 h-5" />
              ) : (
                <FaEye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex text-sm justify-between">
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              id="remember"
              className="w-3 h-3 rounded-full border-brand-forest/30 text-brand-forest focus:ring-brand-accent focus:ring-offset-0 bg-white dark:bg-stone-800"
            />
            <span className="text-brand-sage dark:text-brand-tan">
              Ingat sesi di perangkat ini
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-brand-forest dark:text-brand-accent underline-offset-2 hover:underline shrink-0 pt-0.5"
          >
            Lupa Password
          </Link>
        </div>

        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <FaSpinner className="w-4 h-4 animate-spin" />
              Memproses
            </span>
          ) : (
            "Masuk"
          )}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-forest/10 dark:border-brand-cream/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 text-brand-sage dark:text-brand-tan">atau</span>
        </div>
      </div>

      <GoogleSignInButton label="Masuk dengan Google" mode="login" disabled={loading} />

      <p className="text-brand-sage dark:text-brand-tan/90 text-sm leading-relaxed">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="text-brand-forest dark:text-brand-accent font-semibold underline-offset-4 hover:underline"
        >
          Buat akun
        </Link>
      </p>

      <p className="text-center text-[13px] text-brand-sage dark:text-brand-tan">
        <Link
          href="/"
          className="underline-offset-4 hover:underline hover:text-brand-forest dark:hover:text-brand-cream transition-colors"
        >
          Kembali ke beranda
        </Link>
      </p>
    </div>
  );
}
