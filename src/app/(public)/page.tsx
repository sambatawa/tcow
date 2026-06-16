"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaArrowRight, FaArrowUp, FaChevronRight, FaChevronLeft,
  FaThermometerHalf, FaHeartbeat, FaHeart, FaBroadcastTower,
  FaBrain, FaSyringe, FaStar, FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

/* ── Images ─────────────────────────────────────────────────── */
const IMG = {
  hero:        "https://images.unsplash.com/photo-1680723341624-f38fcfe4f693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXR0bGUlMjBmYXJtJTIwd2lkZSUyMGdyZWVuJTIwbGFuZHNjYXBlJTIwSW5kb25lc2lhfGVufDF8fHx8MTc3NzEwNTAwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  farmer:      "https://images.unsplash.com/photo-1642439994493-3816a23c997a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjB1c2luZyUyMHRhYmxldCUyMHNtYXJ0JTIwYWdyaWN1bHR1cmUlMjBmaWVsZHxlbnwxfHx8fDE3NzEwNTAwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  herd:        "https://images.unsplash.com/photo-1691886789655-0c71dbd54044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYWlyeSUyMGNvdyUyMGhlcmQlMjBncmVlbiUyMHBhc3R1cmV8ZW58MXx8fHwxNzc3MTA0MDczfDA&ixlib=rb-4.1.0&q=80&w=1080",
  sensor:      "https://images.unsplash.com/photo-1648994594394-daf858a463d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJb1QlMjBzZW5zb3IlMjBjb2xsYXIlMjBlYXIlMjB0YWclMjBjYXR0bGUlMjBtb25pdG9yaW5nfGVufDF8fHx8MTc3NzEwNDA3NHww&ixlib=rb-4.1.0&q=80&w=1080",
  vet:         "https://images.unsplash.com/photo-1598555800431-229e18bc8ac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBkb2N0b3IlMjBjaGVja2luZyUyMGNvdyUyMGhlYWx0aHxlbnwxfHx8fDE3NzcxMDQwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  barn:        "https://images.unsplash.com/photo-1628295934652-8f46c0423c2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXR0bGUlMjBicmVlZGluZyUyMGZhcm0lMjBiYXJuJTIwc3RhYmxlfGVufDF8fHx8MTc3NzEwNDA3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  farmerPort:  "https://images.unsplash.com/photo-1776572212829-d62603ee16ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhcm1lciUyMHBvcnRyYWl0JTIwb3V0ZG9vciUyMGZhcm18ZW58MXx8fHwxNzc3MTA0MDc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  cow:         "https://images.unsplash.com/photo-1762592734190-8a2f3b9cdee6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3clMjBlYXIlMjB0YWclMjBJb1QlMjB3ZWFyYWJsZSUyMHNlbnNvciUyMGNvbHNlJTIwdXB8ZW58MXx8fHwxNzc3MTA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  sunrise:     "https://images.unsplash.com/photo-1774463781617-9dc583b82fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXR0bGUlMjBmYXJtJTIwd2lkZSUyMGdyZWVuJTIwbGFuZHNjYXBlJTIwSW5kb25lc2lhfGVufDF8fHx8MTc3NzEwNTAwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  womanFarmer: "https://images.unsplash.com/photo-1628423098951-8650fe174ca4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGZhcm1lciUyMHNtaWxpbmclMjBhZ3JpY3VsdHVyZSUyMG1vcm5hbmdkc2NhcGV8ZW58MXx8fHwxNzc3MTA0MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ── Services data ───────────────────────────────────────────── */
const services = [
  { img: IMG.sensor,  title: "IoT Tracking",       sub: "Sensor wearable real-time" },
  { img: IMG.vet,     title: "Health Analytics",    sub: "Analisis kesehatan berbasis data" },
  { img: IMG.barn,    title: "Breeding Insights",   sub: "Manajemen reproduksi cerdas" },
  { img: IMG.herd,    title: "Cattle Management",   sub: "Kelola koloni & individu" },
];

/* ── Featured solutions ─────────────────────────────────────── */
const solutions = [
  { num: "01", title: "Temperature Monitoring",  desc: "Sensor wearable merekam suhu tubuh sapi secara kontinu — deteksi dini demam & penyakit." },
  { num: "02", title: "FaHeartbeat & Behavior Log", desc: "Catat perubahan perilaku harian sapi untuk analisis tren kesehatan jangka panjang." },
  { num: "03", title: "Automated Health Alerts", desc: "Peringatan otomatis saat suhu sapi melampaui ambang normal 38–39.5 °C." },
];

/* ── Testimonials ────────────────────────────────────────────── */
const testimonials = [
  {
    name: "Pak Hendra Wijaya",
    role: "Peternak — Lembang, Bandung",
    img:  IMG.farmerPort,
    text: "Sejak pakai CowManager, kami bisa deteksi sapi sakit 2 hari lebih awal dari biasanya. Sensor suhu tubuhnya benar-benar mengubah cara kami beternak.",
    stars: 5,
  },
  {
    name: "Bu Sari Dewi",
    role: "Manajer Peternakan — Malang",
    img:  IMG.womanFarmer,
    text: "Platform ini luar biasa! Data rekam medis dan vaksinasi tersentralisasi, tim kami jadi jauh lebih efisien dalam merawat 40+ ekor sapi setiap harinya.",
    stars: 5,
  },
  {
    name: "Pak Budi Santoso",
    role: "Peternak Skala Kecil — Boyolali",
    img:  IMG.farmer,
    text: "CowManager membantu kami yang peternak kecil pun bisa punya sistem monitoring seperti peternakan besar. Simple dan mudah dipahami.",
    stars: 5,
  },
];

/* ── Gallery images ─────────────────────────────────────────── */
const gallery = [IMG.herd, IMG.vet, IMG.sensor, IMG.barn, IMG.cow, IMG.sunrise];

/* ── Health metric cards (mini dashboard mockup) ────────────────────── */
const metrics = [
  { icon: FaThermometerHalf, label: "Suhu Tubuh",   val: "38.6°C",    norm: "Normal",       color: "text-brand-sage", bg: "bg-brand-accent-soft dark:bg-brand-forest/30" },
  { icon: FaHeartbeat,    label: "Aktivitas",     val: "Aktif",     norm: "6.200 langkah", color: "text-brand-forest", bg: "bg-brand-sage-soft dark:bg-brand-forest/30" },
  { icon: FaHeart,       label: "Detak Jantung", val: "72 bpm",     norm: "Skor: 9.1/10",  color: "text-brand-tan",    bg: "bg-brand-tan-soft dark:bg-brand-forest/30" },
];

export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="landing-page">

      {/* ══════════════════════════════════════════════════════════════
          1. HERO
          ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="Farm" className="w-full h-full object-cover" />
          <div className="absolute inset-0 landing-hero-overlay" />
        </div>
        <div className="absolute bottom-32 left-32 w-56 h-56 rounded-full border-2 border-brand-forest/20 hidden lg:block" />
        <div className="absolute bottom-20 left-20 w-32 h-32 rounded-full border border-brand-forest/10 hidden lg:block" />

        <div className="relative flex-1 flex items-center max-w-7xl mx-auto w-full px-6 lg:px-12 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">

            <div className="space-y-7">
              <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold leading-none text-white uppercase tracking-tight">
                Monitor<br />
                <span className="text-brand-sage">Smarter</span><br />
                Keep Cattle<br />
                <span className="text-brand-tan">Healthier</span>
              </h1>
              <p className="text-stone-300 text-base leading-relaxed max-w-md">
                Empowering peternak dengan sensor IoT wearable, analitik kesehatan berbasis data, dan sistem manajemen sapi terintegrasi.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="landing-btn-primary group"
                >
                  Try CowManager
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <FaArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="landing-btn-outline"
                >
                  Login Demo <FaChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur border border-white/15 rounded-2xl px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-brand-tan/25 border border-brand-tan/50 flex items-center justify-center">
                  <FaStar className="w-5 h-5 text-brand-tan fill-brand-tan" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">8+ Sapi Dipantau</p>
                  <p className="text-stone-400 text-xs">Kandang Koloni &amp; Individu</p>
                </div>
              </div>
            </div>

            {/* Image side */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-brand-accent/30 shadow-2xl">
                <img src={IMG.farmer} alt="Smart farming" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-brand-forest/30 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-8 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-4 w-52 border border-stone-100 dark:border-stone-700">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 font-medium">🐄 Sapi #BSH-001 • Live</p>
                <div className="space-y-2">
                  {metrics.map((m) => (
                    <div key={m.label} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${m.bg}`}>
                      <m.icon className={`w-3.5 h-3.5 ${m.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${m.color}`}>{m.val}</p>
                      </div>
                      <span className="text-xs text-stone-400">{m.norm}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-2 -right-4 bg-brand-forest rounded-2xl shadow-xl px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">Live Data</span>
                </div>
                <p className="text-xs text-brand-cream/70 mt-0.5">Update setiap 8 detik</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative pb-8 flex justify-center">
          <div className="flex flex-col items-center gap-1 text-white/40 text-xs animate-bounce">
            <span>Scroll</span>
            <FaChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. ABOUT SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 border border-stone-200 dark:border-stone-700 rounded-full px-4 py-1 text-sm text-brand-forest font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-forest" />
                About CowManager
              </div>
              <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Jika Anda mengelola peternakan sapi — baik kandang koloni maupun individu — penting untuk memahami kondisi kesehatan setiap ekor secara real-time.
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                CowManager menggabungkan sensor wearable IoT dengan platform manajemen digital untuk membantu peternak membuat keputusan berbasis data yang lebih baik.
              </p>
              <div className="flex items-start gap-4">
                <div className="flex -space-x-2 shrink-0">
                  {[IMG.farmerPort, IMG.womanFarmer, IMG.farmer].map((src, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white dark:border-stone-900 overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">CowManager</span> membantu kami boost produktivitas sekaligus menjaga kesehatan ternak. Ini mengubah cara kami beternak.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: "100%",   label: "Data Terekam Otomatis",       color: "bg-brand-forest/10 dark:bg-brand-forest/20 border-brand-forest/100 dark:border-brand-forest/80" },
                  { val: "35+",    label: "Parameter Kesehatan Dipantau", color: "bg-brand-forest/10 dark:bg-brand-forest/20  border-brand-forest/100  dark:border-brand-forest/80" },
                  { val: "7 Hari", label: "Histori Suhu untuk ML",        color: "bg-brand-forest/10 dark:bg-brand-forest/20   border-brand-forest/100   dark:border-brand-forest/80" },
                  { val: "24/7",   label: "Monitoring Tanpa Henti",       color: "bg-brand-forest/10 dark:bg-brand-forest/20 border-brand-forest/100 dark:border-brand-forest/80" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border p-6 ${s.color}`}>
                    <p className="text-3xl font-bold text-stone-800 dark:text-stone-100">{s.val}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-brand-forest dark:text-brand-forest font-medium hover:gap-3 transition-all text-sm"
              >
                Pelajari lebih lanjut <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. SERVICES & SOLUTIONS
          ════════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-section-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-brand-forest dark:text-brand-forest text-sm font-medium uppercase tracking-widest">Layanan Kami</span>
              <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Solusi Lengkap<br />untuk Peternakan Modern
              </h2>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xs leading-relaxed">
              Platform terintegrasi kami dirancang untuk memberikan gambaran kesehatan sapi yang komprehensif dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s) => (
              <Link
                key={s.title}
                href="/features"
                className="group relative overflow-hidden rounded-2xl aspect-3/4 block"
              >
                <img
                  src={s.img}
                  alt={s.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <FaArrowUp className="w-4 h-4 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold text-base leading-tight">{s.title}</p>
                  <p className="text-stone-300 text-xs mt-1">{s.sub}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 border border-brand-forest hover:border-brand-forest text-brand-forest hover:text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all"
            >
              View All Features
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. FEATURED SOLUTIONS
          ════════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-3">
              <img src={IMG.herd} alt="" className="w-full h-64 object-cover rounded-2xl shadow-lg" />
              <div className="grid grid-cols-3 gap-3">
                {[IMG.vet, IMG.sensor, IMG.cow].map((src, i) => (
                  <img key={i} src={src} alt="" className="h-24 w-full object-cover rounded-xl" />
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-brand-sage dark:text-brand-accent text-sm font-medium uppercase tracking-widest">
                  Smart Farming Solutions
                </span>
                <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  Teknologi Wearable untuk Kesehatan Sapi Lebih Baik
                </h2>
              </div>

              <p className="mt-4 text-stone-500 dark:text-stone-400 leading-relaxed">
                Sensor collar dan ear-tag merekam suhu tubuh sapi secara kontinu. Data ini digunakan sebagai input machine learning untuk mendeteksi perubahan kondisi kesehatan sebelum gejala klinis muncul.
              </p>

              <div className="space-y-3">
                {solutions.map((s, i) => (
                  <div
                    key={s.num}
                    className={`flex items-start gap-4 px-5 py-4 rounded-xl border transition-all cursor-default ${
                      i === 1
                        ? "bg-brand-sage border-brand-sage text-white shadow-lg shadow-brand-sage/25"
                        : "border-stone-200 dark:border-stone-700 hover:border-brand-sage dark:hover:border-brand-sage/60"
                    }`}
                  >
                    <span className={`text-xs font-bold mt-0.5 shrink-0 ${i === 1 ? "text-brand-cream/70" : "text-stone-400"}`}>
                      {s.num}
                    </span>
                    <div className="flex-1">
                      <h3 className={`font-bold mb-2 ${i === 1 ? "text-white" : "text-stone-800 dark:text-stone-200"}`}>{s.title}</h3>
                      <p className={`text-xs leading-relaxed ${i === 1 ? "text-brand-cream/70" : "text-stone-500 dark:text-stone-400"}`}>{s.desc}</p>
                    </div>
                    <FaArrowUp className={`w-4 h-4 shrink-0 mt-0.5 ${i === 1 ? "text-white" : "text-stone-300 dark:text-stone-600"}`} />
                  </div>
                ))}
              </div>

              <Link
                href="/features"
                className="inline-flex items-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-7 py-3 rounded-full font-semibold hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors text-sm"
              >
                Lihat Cara Kerjanya <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. HEALTH MONITORING — metrics showcase
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-gradient-panel relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img src={IMG.sunrise} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-linear-to-br from-brand-forest/95 to-brand-sage/80" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-brand-accent text-sm font-medium uppercase tracking-widest">Cattle Health Monitoring</span>
            <h2 className="mt-2 text-4xl font-bold text-white">Parameter yang Kami Pantau</h2>
            <p className="mt-3 text-brand-cream/80 max-w-xl mx-auto">
              Setiap sensor wearable memantau kondisi vital sapi secara terus-menerus dan mengirimkan data ke dashboard Anda.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {[
              { icon: FaThermometerHalf, title: "Suhu Tubuh",       val: "38.6°C",    norm: "Normal: 38–39.5°C",  color: "emerald" },
              { icon: FaHeartbeat,    title: "Aktivitas Harian", val: "Aktif",      norm: "6.200 langkah/hari", color: "blue" },
              { icon: FaHeart,       title: "Status Kesehatan", val: "Sehat",      norm: "Skor: 9.1/10",       color: "rose" },
              { icon: FaBroadcastTower,       title: "Koneksi Sensor",   val: "Online",     norm: "Sinyal: Kuat",       color: "violet" },
              { icon: FaBrain,       title: "ML Prediction",    val: "Normal",     norm: "Probabilitas: 97%",  color: "amber" },
              { icon: FaSyringe,     title: "Vaksinasi",        val: "Up-to-date", norm: "Next: Jul 2025",     color: "teal" },
            ].map((m) => (
              <div key={m.title} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-${m.color}-500/20 flex items-center justify-center mb-4`}>
                  <m.icon className={`w-6 h-6 text-${m.color}-400`} />
                </div>
                <p className="text-stone-400 text-sm mb-1">{m.title}</p>
                <p className="text-white font-bold text-xl">{m.val}</p>
                <p className="text-stone-500 text-xs mt-1">{m.norm}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-brand-cream/80 text-sm font-medium mb-4">📊 Tren Suhu Tubuh — BSH-001 (7 hari terakhir)</p>
            <div className="flex items-end gap-2 h-20">
              {[68, 72, 75, 88, 78, 74, 76].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm transition-all ${h >= 85 ? "bg-red-400" : "bg-brand-accent"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-stone-500 text-xs">{["S","M","S","R","K","J","S"][i]}</span>
                </div>
              ))}
            </div>
            <p className="text-stone-500 text-xs mt-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-400 rounded-sm inline-block" /> Rabu: 39.8°C — alert terkirim otomatis
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. TESTIMONIALS
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-section-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-brand-sage dark:text-brand-accent text-sm font-medium uppercase tracking-widest">Testimoni</span>
              <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                What Farmers<br />Are Saying
              </h2>
              <p className="mt-4 text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm">
                Dengarkan langsung dari peternak yang sudah merasakan manfaat nyata dari sistem monitoring CowManager.
              </p>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setActiveTestimonial((p) => (p - 1 + testimonials.length) % testimonials.length)}
                  className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-600 text-stone-500 hover:border-brand-accent hover:text-brand-sage flex items-center justify-center transition-all"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTestimonial((p) => (p + 1) % testimonials.length)}
                  className="w-10 h-10 rounded-full bg-brand-sage text-white flex items-center justify-center hover:bg-brand-accent transition-colors"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className={`bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 p-8 transition-all duration-300 ${
                    i === activeTestimonial ? "opacity-100 translate-y-0" : "opacity-0 absolute inset-0 translate-y-4 pointer-events-none"
                  }`}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <FaStar key={si} className="w-4 h-4 text-brand-tan fill-brand-tan" />
                    ))}
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-stone-100 dark:border-stone-700">
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">{t.name}</p>
                      <p className="text-stone-400 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. FARM GALLERY
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-brand-cream/70 text-sm font-medium uppercase tracking-widest">Vis</span>
              <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100">Farm Gallery</h2>
            </div>
            <Link href="/about" className="text-sm text-stone-400 hover:text-brand-sage dark:hover:text-brand-accent flex items-center gap-1 transition-colors">
              Lihat Semua <FaChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="row-span-2">
              <img src={gallery[0]} alt="" className="w-full h-full object-cover rounded-2xl" style={{ minHeight: 360 }} />
            </div>
            <img src={gallery[1]} alt="" className="col-span-1 h-44 w-full object-cover rounded-2xl" />
            <img src={gallery[2]} alt="" className="col-span-1 h-44 w-full object-cover rounded-2xl" />
            <img src={gallery[3]} alt="" className="col-span-1 h-44 w-full object-cover rounded-2xl" />
            <img src={gallery[4]} alt="" className="col-span-1 h-44 w-full object-cover rounded-2xl" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          8. CTA FINAL
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 landing-section-dark">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <span className="text-brand-accent text-sm font-medium uppercase tracking-widest">Mulai Sekarang</span>
          <h2 className="mt-3 text-4xl font-bold text-white">
            Daftarkan Farm Anda dan Mulai Pantau Kesehatan Sapi
          </h2>
          <p className="mt-4 text-brand-cream/80 max-w-xl mx-auto leading-relaxed">
            Bergabung dengan ribuan peternak yang telah mempercayai CowManager untuk meningkatkan produktivitas dan kesehatan ternak mereka.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="landing-btn-accent"
            >
              Daftar Gratis <FaArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/features"
              className="border border-brand-sage/60 hover:border-brand-accent text-brand-cream/80 hover:text-white px-8 py-3.5 rounded-full font-medium transition-all"
            >
              Lihat Fitur
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-5 text-brand-cream/80 text-sm">
            {["Tanpa biaya setup", "Data aman & privat", "Dukungan teknis", "Update rutin"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <FaCheckCircle className="w-4 h-4 text-brand-accent shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
