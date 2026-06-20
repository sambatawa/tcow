"use client";

import Link from "next/link";
import { FaLeaf, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { TCowLogo } from "@/components/ui/TCowLogo";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isRegister = pathname?.includes("register");

  return (
    <div className="min-h-screen w-full bg-brand-cream/50 dark:bg-[#12180e] overflow-hidden relative">
      <div className="lg:hidden absolute top-5 right-5 sm:top-6 sm:right-6 z-50">
        <button className="p-2.5 rounded-xl text-brand-forest/70 hover:text-brand-forest dark:text-brand-cream/70 dark:hover:text-brand-cream hover:bg-brand-forest/5 dark:hover:bg-brand-cream/10 transition-colors bg-white/20 dark:bg-black/20 backdrop-blur-sm shadow-sm" type="button" onClick={toggleTheme} aria-label="Ganti tema">
          {isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
        </button>
      </div>

      <div className="lg:hidden flex flex-col min-h-screen relative p-6 sm:p-10 justify-center items-center">
        <div className="absolute inset-0 landing-hero-overlay opacity-[0.14] pointer-events-none" aria-hidden />
        <div className="w-full max-w-[420px] relative space-y-10 z-10">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-9 h-9 bg-brand-accent rounded-full flex items-center justify-center shrink-0">
              <TCowLogo className="w-5 h-5" />
            </div>
            <span className="font-semibold text-brand-forest dark:text-brand-cream text-lg">T-Cow°</span>
          </div>
          {children}
        </div>
      </div>

      <div className={`hidden lg:flex w-[200%] h-screen transition-transform duration-700 ease-in-out ${isRegister ? "auth-slider-register" : "auth-slider-login"}`}>
        <div className="w-1/2 h-full flex">
          <div className="w-[46%] h-full flex flex-col justify-between relative overflow-hidden p-10 xl:p-12 landing-gradient-panel text-brand-cream">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]"/>
            <div className="relative justify-between flex">
              <div className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-full bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-forest/20 group-hover:bg-brand-accent/90 transition-colors">
                  <TCowLogo className="w-6 h-6" />
                </div>
                <span className="text-xl font-semibold tracking-tight">T-Cow°</span>
              </div>
              <div className="absolute right-5 sm:right-6 z-50">
                <button className="p-2.5 rounded-xl text-brand-forest/70 hover:text-brand-forest dark:text-brand-cream/70 dark:hover:text-brand-cream hover:bg-brand-forest/5 dark:hover:bg-brand-cream/10 transition-colors bg-white/20 dark:bg-black/20 backdrop-blur-sm shadow-sm" type="button" onClick={toggleTheme} aria-label="Ganti tema">
                  {isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="relative space-y-8 max-w-lg">
              <div>
                <p className="text-brand-accent/95 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                  Peternakan lebih terukur
                </p>
                <h1 className="text-3xl xl:text-[2.1rem] font-bold leading-snug">
                  Pantau kesehatan sapi dari satu dasbor yang sama dengan tim Anda.
                </h1>
                <p className="mt-4 text-brand-cream/85 text-[15px] leading-relaxed">
                  Sensor wearable, rekaman vital, dan notifikasi — dirancang agar Anda fokus ke ternak, bukan ke kertas.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-xl border border-brand-cream/20 bg-brand-forest/25 backdrop-blur-md px-4 py-3">
                  <dt className="text-brand-tan font-medium">Monitor</dt>
                  <dd className="text-brand-cream/90 mt-0.5">Suhu &amp; pola harian tiap ekor</dd>
                </div>
                <div className="rounded-xl border border-brand-cream/20 bg-brand-forest/25 backdrop-blur-md px-4 py-3">
                  <dt className="text-brand-tan font-medium">Riwayat</dt>
                  <dd className="text-brand-cream/90 mt-0.5">Medis dan vaksinasi terpusat</dd>
                </div>
                <div className="rounded-xl border border-brand-cream/20 bg-brand-forest/25 backdrop-blur-md px-4 py-3">
                  <dt className="text-brand-tan font-medium">Akses peran</dt>
                  <dd className="text-brand-cream/90 mt-0.5">Teknisi &amp; operator terpisah aman</dd>
                </div>
                <div className="rounded-xl border border-brand-cream/20 bg-brand-forest/25 backdrop-blur-md px-4 py-3">
                  <dt className="text-brand-tan font-medium">Lapangan</dt>
                  <dd className="text-brand-cream/90 mt-0.5">Cukup di ponsel, tetap sama datanya</dd>
                </div>
              </dl>
            </div>
            <div className="relative text-brand-cream/55 text-xs">
              © T-Cow° - Website kolaborasi TEKOM dan TNK
            </div>
          </div>
          <div className="flex-1 h-full flex items-center justify-center p-10 bg-brand-cream/50 dark:bg-[#12180e]">
            <div className="w-full max-w-[420px]">
              {!isRegister && children}
            </div>
          </div>
        </div>

        <div className="w-1/2 h-full flex flex-row-reverse">
          <div className="w-[46%] h-full flex flex-col justify-between relative overflow-hidden p-10 xl:p-12 landing-gradient-panel text-brand-cream">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]"/>
            <div className="relative flex justify-between items-center">
              <button className="p-2.5 rounded-xl text-brand-forest/70 hover:text-brand-forest dark:text-brand-cream/70 dark:hover:text-brand-cream hover:bg-brand-forest/5 dark:hover:bg-brand-cream/10 transition-colors bg-white/20 dark:bg-black/20 backdrop-blur-sm shadow-sm" type="button" onClick={toggleTheme} aria-label="Ganti tema">
                {isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-full bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-forest/20 group-hover:bg-brand-accent/90 transition-colors">
                  <FaLeaf className="w-6 h-6 text-brand-forest" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Adyatma Farm</span>
              </div>
            </div>
            <div className="relative space-y-8 max-w-lg">
              <div>
                <p className="text-brand-accent/95 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Peternakan lebih terukur</p>
                <h1 className="text-3xl xl:text-[2.1rem] font-bold leading-snug">Kelola peran infrastruktur tim lapangan secara terintegrasi.</h1>
                <p className="mt-4 text-brand-cream/85 text-[15px] leading-relaxed">Daftarkan akun tim Anda untuk pembagian hak akses monitoring kesehatan sapi perah secara real-time.</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-xl border border-brand-cream/20 bg-brand-forest/25 backdrop-blur-md px-4 py-3">
                  <dt className="text-brand-tan font-medium">Akses peran</dt>
                  <dd className="text-brand-cream/90 mt-0.5">Teknisi &amp; operator terpisah aman</dd>
                </div>
                <div className="rounded-xl border border-brand-cream/20 bg-brand-forest/25 backdrop-blur-md px-4 py-3">
                  <dt className="text-brand-tan font-medium">Lapangan</dt>
                  <dd className="text-brand-cream/90 mt-0.5">Cukup di ponsel, tetap sama datanya</dd>
                </div>
              </dl>
            </div>
            <div className="relative text-brand-cream/55 text-xs">© AdyatmaKom - Website kolaborasi TEKOM dan TNK</div>
          </div>
          <div className="flex-1 h-full flex items-center justify-center p-10 bg-brand-cream/50 dark:bg-[#12180e]">
            <div className="w-full max-w-[420px]">
              {isRegister && children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}