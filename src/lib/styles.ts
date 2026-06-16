import React from "react";
import { GiMedicalThermometer, GiSyringe, GiMedicines, GiScissors } from "react-icons/gi";
import { FaBaby } from "react-icons/fa";

export const glassBlock = "rounded-xl border border-brand-forest/14 dark:border-brand-cream/12 bg-white/20 dark:bg-stone-900/50 backdrop-blur-xl px-4 py-3.5 shadow-[0_8px_32px_rgba(53,64,36,0.08)] transition-all focus-within:border-brand-sage/50 focus-within:ring-2 focus-within:ring-brand-accent/22 dark:shadow-black/30";
export const lbl = "block text-[11px] font-semibold uppercase tracking-wider text-brand-sage dark:text-brand-tan mb-2";
export const inputClass ="w-full appearance-none bg-transparent autofill:bg-transparent border-0 border-b border-brand-sage/30 p-0 text-[15px] text-brand-forest dark:text-brand-cream placeholder:text-brand-sage/50 dark:placeholder:text-brand-tan/45 focus:outline-none focus:ring-0 focus:!bg-transparent";
export const buttonClass = "w-full rounded-b-xl bg-brand-forest dark:bg-brand-sage py-3.5 text-brand-cream text-sm font-semibold hover:opacity-[0.96] disabled:opacity-50 transition-opacity flex items-center justify-center gap-2";

export const healthColors: Record<string, string> = {
  Sehat: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  Perhatian: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Sakit: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export const statusColors: Record<string, string> = {
  Laktasi: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Bunting: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  Kering: "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400",
  Dara: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
};

export const vaccineStatusStyle: Record<string, string> = {
  Selesai: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  Terjadwal: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Terlambat: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export const kategoriColor: Record<string, string> = {
  pemeriksaan: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  vaksinasi: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  pengobatan: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  reproduksi: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  perawatan: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
}; 
export const kategoriIcon: Record<string, React.ElementType> = {
  pemeriksaan: GiMedicalThermometer,
  vaksinasi: GiSyringe,
  pengobatan: GiMedicines,
  reproduksi: FaBaby,
  perawatan: GiScissors,
};

