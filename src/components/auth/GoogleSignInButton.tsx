"use client";

import { FaGoogle, FaSpinner } from "react-icons/fa";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type GoogleSignInButtonProps = {
  label: string;
  mode: "login" | "register";
  farmCode?: string;
  disabled?: boolean;
  redirectTo?: string;
};

export function GoogleSignInButton({label, mode, farmCode, disabled, redirectTo = "/dashboard"}: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    if (mode === "register" && !farmCode?.trim()) {
      toast.error("Verifikasi no kode farm terlebih dahulu.");
      return;
    }

    setLoading(true);
    const result = await signInWithGoogle(
      mode === "register" ? { no_kode: farmCode!.trim() } : undefined
    );
    setLoading(false);

    if (!result.success) {
      if (result.error !== "popup-closed") {
        toast.error(result.error ?? "Gagal masuk dengan Google");
      }
      return;
    }

    toast.success(
      mode === "register"
        ? "Akun Google berhasil dibuat."
        : "Berhasil masuk dengan Google."
    );
    router.push(redirectTo);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="w-full rounded-t-xl border border-brand-forest/20 dark:border-brand-cream/20 bg-white/65 dark:bg-stone-900/50 py-3.5 text-brand-forest dark:text-brand-cream text-sm font-semibold hover:bg-brand-forest/5 dark:hover:bg-brand-cream/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <FaSpinner className="w-4 h-4 animate-spin" />
        </>
      ) : (
        <>
          {label}
          <FaGoogle />
        </>
      )}
    </button>
  );
}