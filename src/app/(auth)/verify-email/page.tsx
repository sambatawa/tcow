"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSpinner, FaRedo } from "react-icons/fa";
import { toast } from "sonner";
import { glassBlock, lbl, inputClass, buttonClass } from "@/lib/styles";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { apiFetch, apiPost } from "@/lib/api-client";
import { formatDurationSeconds } from "@/lib/format";
import { normalizeEmail } from "@/lib/validation";

type VerificationStatus = {
  resendCount: number;
  remainingResends: number;
  maxResendsPerCycle: number;
  canResend: boolean;
  locked: boolean;
  lockSecondsRemaining: number;
  resendCooldownSeconds: number;
  codeExpired: boolean;
  codeExpiresInSeconds: number;
};

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const router = useRouter();

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const [resendCount, setResendCount] = useState(0);
  const [remainingResends, setRemainingResends] = useState(3);
  const [locked, setLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [codeExpiresIn, setCodeExpiresIn] = useState(60);

  const canResend =
    !locked && remainingResends > 0 && resendCooldown === 0 && !resendLoading;

  const loadStatus = useCallback(async () => {
    if (!emailParam) return;
    const result = await apiFetch<VerificationStatus>(
      `/api/auth/verification-status?email=${encodeURIComponent(normalizeEmail(emailParam))}`
    );
    if (result.ok) {
      const data = result.data;
      setResendCount(data.resendCount);
      setRemainingResends(data.remainingResends);
      setLocked(data.locked);
      setLockSeconds(data.lockSecondsRemaining);
      setResendCooldown(data.resendCooldownSeconds);
      setCodeExpiresIn(data.codeExpiresInSeconds);
    }
    setStatusLoading(false);
  }, [emailParam]);

  useEffect(() => {
    setEmail(emailParam);
    loadStatus();
  }, [emailParam, loadStatus]);

  useEffect(() => {
    if (!emailParam) {
      router.push("/register");
    }
  }, [emailParam, router]);

  useEffect(() => {
    if (statusLoading) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
      setLockSeconds((s) => (s > 0 ? s - 1 : 0));
      setCodeExpiresIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [statusLoading]);

  useEffect(() => {
    if (lockSeconds === 0 && locked) {
      setLocked(false);
      loadStatus();
    }
  }, [lockSeconds, locked, loadStatus]);

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      const nextInput = document.getElementById(
        `code-${index + 1}`
      ) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(
        `code-${index - 1}`
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(
        `code-${index - 1}`
      ) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      const nextInput = document.getElementById(
        `code-${index + 1}`
      ) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = ["", "", "", "", "", ""];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);

    const nextEmptyIndex = newCode.findIndex((val) => val === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    setTimeout(() => {
      const input = document.getElementById(
        `code-${focusIndex}`
      ) as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  };

  const getFullCode = () => code.join("");

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError("");

    const result = await apiPost<{
      resendCount?: number;
      remainingResends?: number;
      retryAfterSeconds?: number;
      locked?: boolean;
      lockSecondsRemaining?: number;
      resendCooldownSeconds?: number;
      codeExpiresInSeconds?: number;
    }>("/api/auth/resend-verification", { email: normalizeEmail(email) });

    if (!result.ok) {
      if (result.data?.retryAfterSeconds) {
        if (result.data.locked || result.error.includes("dikunci")) {
          setLocked(true);
          setLockSeconds(result.data.retryAfterSeconds);
        } else {
          setResendCooldown(result.data.retryAfterSeconds);
        }
      }
      setError(result.error);
      setResendLoading(false);
      return;
    }

    toast.success("Kode verifikasi baru telah dikirim ke email Anda.");
    setResendCount(result.data.resendCount ?? 0);
    setRemainingResends(result.data.remainingResends ?? 0);
    setResendCooldown(result.data.resendCooldownSeconds ?? 60);
    setCodeExpiresIn(result.data.codeExpiresInSeconds ?? 60);
    setLocked(result.data.locked ?? false);
    setLockSeconds(result.data.lockSecondsRemaining ?? 0);
    setCode(["", "", "", "", "", ""]);
    setResendLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim())
      return setError("Email tidak ditemukan. Silakan daftar ulang.");
    if (!/^\d{6}$/.test(getFullCode())) {
      return setError("Masukkan kode 6 digit dari email Anda.");
    }
    if (codeExpiresIn <= 0) {
      return setError(
        "Kode sudah kedaluwarsa. Minta kode baru dengan tombol kirim ulang."
      );
    }

    setLoading(true);
    const result = await apiPost<{ codeExpired?: boolean }>(
      "/api/auth/verify-email",
      { email: normalizeEmail(email), code: getFullCode() }
    );

    if (!result.ok) {
      setError(result.error);
      if (result.data?.codeExpired) setCodeExpiresIn(0);
      setLoading(false);
      return;
    }

    toast.success("Email berhasil diverifikasi. Silakan masuk.");
    router.push("/login");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-brand-forest dark:text-brand-cream text-2xl font-bold tracking-tight">
          Verifikasi Email
        </h1>
        <p className="text-brand-sage dark:text-brand-tan/90 mt-2 text-sm leading-relaxed">
          Kami mengirim kode 6 digit ke email Anda. Kode berlaku{" "}
          <strong>60 detik</strong> — setelah itu minta kode baru (maks. 3 kali
          per jam).
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthErrorBanner message={error} />

        {locked && lockSeconds > 0 && (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/35 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 text-sm">
            Terlalu banyak permintaan kode. Coba lagi dalam{" "}
            <strong>{formatDurationSeconds(lockSeconds, "short")}</strong>.
          </div>
        )}

        {email && (
          <div className={glassBlock}>
            <label className={lbl}>Email</label>
            <div className={inputClass}>{email}</div>
          </div>
        )}

        <div className={glassBlock}>
          <div className="flex items-center justify-between mb-3">
            <label className={lbl} htmlFor="verify-code">
              Kode verifikasi
            </label>
            <div className="flex items-center gap-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || statusLoading}
                  className="p-2 text-brand-forest dark:text-brand-accent hover:bg-brand-forest/10 dark:hover:bg-brand-accent/20 rounded-lg transition-colors disabled:text-brand-sage dark:text-brand-tan disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Kirim ulang kode"
                >
                  {resendLoading ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaRedo className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div
                  className="text-xs text-brand-sage dark:text-brand-tan px-2 py-1"
                  title={
                    locked
                      ? "Terkunci"
                      : resendCooldown > 0
                        ? "Tunggu sebelum kirim ulang"
                        : "Batas kirim ulang"
                  }
                >
                  {locked
                    ? formatDurationSeconds(lockSeconds, "short")
                    : resendCooldown > 0
                      ? `${resendCooldown}s`
                      : remainingResends === 0
                        ? "Habis"
                        : "—"}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-12 text-center text-lg font-mono font-semibold border-2 rounded-lg transition-colors ${
                  digit
                    ? "border-brand-forest dark:border-brand-accent bg-brand-forest/5 dark:bg-brand-accent/10 text-brand-forest dark:text-brand-accent"
                    : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-brand-forest dark:focus:border-brand-accent"
                } focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:focus:ring-brand-accent/20`}
                placeholder="_"
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-1 mt-3">
            {codeExpiresIn > 0 ? (
              <div className="text-xs text-brand-sage dark:text-brand-tan">
                Kode aktif: {codeExpiresIn}s
              </div>
            ) : (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Kode kedaluwarsa — minta kode baru
              </div>
            )}

            <div className="text-xs text-brand-sage dark:text-brand-tan">
              Sisa kirim ulang: {remainingResends} dari 3
              {resendCount > 0 && ` (sudah ${resendCount}x)`}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <FaSpinner className="w-4 h-4 animate-spin" />
              Memverifikasi...
            </span>
          ) : (
            "Verifikasi"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-brand-sage dark:text-brand-tan">
        Sudah verifikasi?{" "}
        <Link
          href="/login"
          className="text-brand-forest dark:text-brand-accent font-semibold hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <FaSpinner className="w-6 h-6 animate-spin text-brand-sage" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
