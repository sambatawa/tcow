"use client";

import { useState } from "react";
import { FaSpinner, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { glassBlock, lbl, inputClass, buttonClass } from "@/lib/styles";

interface PageRegister1Props {
  onNext: (code: string) => void;
  loading: boolean;
}

export default function PageRegister1({ onNext, loading }: PageRegister1Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("No kode wajib diisi.");
      return;
    }
    setError("");
    onNext(code);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-brand-forest dark:text-brand-cream text-2xl font-bold tracking-tight">
          Verifikasi Kode Farm
        </h1>
        <p className="text-brand-sage dark:text-brand-tan/90 mt-2 text-sm leading-relaxed">
          Masukkan kode farm Anda untuk melanjutkan pendaftaran.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className={`${glassBlock} ${error? "border-red-300/70 dark:border-red-500/40 focus-within:ring-red-400/35" : ""}`}>
            <label className={lbl} htmlFor="farm-code">
              No Kode Farm
            </label>
            <input id="farm-code" placeholder="Masukkan no kode farm" className={`${inputClass} font-mono uppercase tracking-wide text-[14px]`} type="text" value={code} onChange={(e) => { setCode(
              e.target.value.toUpperCase());
              setError("");
            }}
              />
          </div>
          {error && (
            <p className="flex items-center gap-1.5 mt-2 text-[13px] text-red-600 dark:text-red-400 px-1">
              <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}
          <p className="mt-3 text-[12px] text-brand-sage/90 dark:text-brand-tan/80 leading-snug pt-2.5">
            Kode farm akan diverifikasi dengan database sebelum melanjutkan ke langkah berikutnya.
          </p>
        </div>

        <button className={buttonClass} type="submit" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <FaSpinner className="w-4 h-4 animate-spin" />
              Memverifikasi...
            </div>
          ) : ("Lanjut")}
        </button>
      </form>
      <p className="text-center text-brand-sage dark:text-brand-tan/90 mt-2 text-sm leading-relaxed">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand-forest dark:text-brand-accent font-semibold underline-offset-4 hover:underline">
          Masuk
        </Link>
      </p>
      <p className="text-center text-sm text-brand-sage dark:text-brand-tan pb-4">
        <a href="/" className="flex gap-2 text-brand-sage dark:text-brand-tan hover:text-brand-forest dark:hover:text-brand-cream transition-colors mb-4">
          <FaArrowLeft className="w-4 h-4" />
          Kembali ke beranda
        </a>
      </p>
      
    </div>
  );
}
