"use client";

import Link from "next/link";
import {
  FaArrowRight, FaArrowUp, FaCheckCircle,
  FaBroadcastTower, FaWrench, FaChartBar, FaBell,
  FaThermometerHalf, FaBrain, FaSyringe, FaClipboard,
  FaShieldAlt, FaUsers, FaMoon, FaMobileAlt, FaFileAlt, FaBolt,
} from "react-icons/fa";
import { GiCow } from "react-icons/gi";

/* ── Images ─────────────────────────────────────────────────────────── */
const IMG_SENSOR  = "https://images.unsplash.com/photo-1762381650890-43b1030fc842?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3clMjBlYXIlMjB0YWclMjBJb1QlMjB3ZWFyYWJsZSUyMHNlbnNvciUyMGNvbHNlJTIwdXB8ZW58MXx8fHwxNzc3MTA1MDA2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_VET     = "https://images.unsplash.com/photo-1598555800431-229e18bc8ac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBkb2N0b3IlMjBjaGVja2luZyUyMGNvdyUyMGhlYWx0aHxlbnwxfHx8fDE3NzcxMDQwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_HERD    = "https://images.unsplash.com/photo-1691886789655-0c71dbd54044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYWlyeSUyMGNvdyUyMGhlcmQlMjBncmVlbiUyMHBhc3R1cmV8ZW58MXx8fHwxNzc3MTA0MDczfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_DASH    = "https://images.unsplash.com/photo-1580982186123-27ab767830aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkJTIwc2NyZWVuJTIwYWdyaWN1bHR1cmV8ZW58MXx8fHwxNzc3MTA1MDExfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_BARN    = "https://images.unsplash.com/photo-1628295934652-8f46c0423c2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXR0bGUlMjBicmVlZGluZyUyMGZhcm0lMjBiYXJuJTIwc3RhYmxlfGVufDF8fHx8MTc3NzEwNDA3Nnww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_FARMER  = "https://images.unsplash.com/photo-1642439994493-3816a23c997a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjB1c2luZyUyMHRhYmxldCUyMHNtYXJ0JTIwYWdyaWN1bHR1cmUlMjBmaWVsZHxlbnwxfHx8fDE3NzcxMDQwNzN8MA&ixlib=rb-4.1.0&q=80&w=1080";

/* ── Main features — alternating layout ─────────────────────────────── */
const mainFeatures = [
  {
    id: "cattle",
    icon: GiCow,
    badge: "Manajemen Sapi",
    title: "Profil & Rekam Medis Lengkap",
    desc: "Kelola data setiap ekor sapi secara detail — dari profil dasar, riwayat medis, jadwal vaksinasi, hingga log aktivitas harian. Tersedia untuk kandang koloni maupun kandang individu.",
    img: IMG_HERD,
    color: "bg-brand-tan-soft dark:bg-brand-forest/30",
    iconColor: "text-brand-forest dark:text-brand-tan",
    points: [
      "Profil lengkap: nama, breed, usia, bobot, kandangKategori",
      "Riwayat medis dan jadwal vaksinasi terpusat",
      "Status reproduksi dan riwayat kebuntingan",
      "Log aktivitas: pemeriksaan, pengobatan, perawatan kuku",
      "Tampilan tab Overview, Rekam Medis, Vaksinasi, Genetika",
    ],
  },
  {
    id: "sensor",
    icon: FaBroadcastTower,
    badge: "Sensor IoT Wearable",
    title: "Monitoring Suhu Tubuh Real-time",
    desc: "Sensor collar dan ear-tag merekam suhu tubuh sapi secara kontinu. Data dikirim ke dashboard setiap 8 detik dan disimpan sebagai time-series untuk analisis machine learning.",
    img: IMG_SENSOR,
    color: "bg-brand-sage-soft dark:bg-brand-forest/30",
    iconColor: "text-brand-sage dark:text-brand-cream",
    points: [
      "Sensor wearable collar/ear-tag pada setiap sapi",
      "Data suhu tubuh real-time (38–39.5°C = normal)",
      "Histori suhu 7 hari untuk tren & anomali",
      "Alert otomatis saat suhu melampaui ambang",
      "Status koneksi & baterai sensor terpantau",
    ],
  },
  {
    id: "analytics",
    icon: FaBrain,
    badge: "ML Analytics",
    title: "Analitik Berbasis Machine Learning",
    desc: "Data suhu time-series diproses untuk menghasilkan prediksi kondisi kesehatan sapi. Model ML membantu deteksi dini penyakit sebelum gejala klinis muncul.",
    img: IMG_DASH,
    color: "bg-brand-accent-soft dark:bg-brand-forest/30",
    iconColor: "text-brand-accent dark:text-brand-cream",
    points: [
      "Dataset suhu tubuh terstruktur siap untuk ML",
      "Prediksi status kesehatan berbasis perubahan suhu",
      "Grafik tren interaktif dengan Recharts",
      "Skor kesehatan per sapi (1–10)",
      "Export data untuk pelatihan model eksternal",
    ],
  },
  {
    id: "maintenance",
    icon: FaWrench,
    badge: "Maintenance Sistem",
    title: "Manajemen Sensor & Perangkat",
    desc: "Pastikan semua sensor wearable beroperasi optimal. Jadwalkan perawatan, catat riwayat perbaikan, dan pantau status setiap perangkat IoT di lapangan.",
    img: IMG_BARN,
    color: "bg-brand-cream dark:bg-brand-forest/40",
    iconColor: "text-brand-forest dark:text-brand-cream",
    points: [
      "Jadwal maintenance sensor terjadwal",
      "Riwayat perbaikan dan penggantian perangkat",
      "Penugasan teknisi lapangan",
      "Prioritas perbaikan: Tinggi / Sedang / Rendah",
      "Status maintenance real-time per perangkat",
    ],
  },
];

/* ── Service image cards — like homepage section ─────────────────────── */
const serviceCards = [
  { img: IMG_HERD,   title: "Manajemen Sapi",      sub: "Koloni & Individu" },
  { img: IMG_SENSOR, title: "Sensor Wearable",      sub: "Suhu real-time" },
  { img: IMG_VET,    title: "Rekam Medis Digital", sub: "Terintegrasi & terpusat" },
  { img: IMG_FARMER, title: "Teknisi & Pengguna",     sub: "Multi-role access" },
];

/* ── Additional features grid ────────────────────────────────────────── */
const additionalFeatures = [
  { icon: FaChartBar,    title: "Dashboard Analitik",  desc: "Visualisasi KPI dan grafik interaktif kondisi seluruh sapi." },
  { icon: FaBell,         title: "Alert & Notifikasi", desc: "Peringatan otomatis via toast saat suhu atau sensor anomali." },
  { icon: FaMoon,         title: "Dark Mode",           desc: "Tampilan gelap nyaman untuk penggunaan malam hari di kandang." },
  { icon: FaMobileAlt,   title: "Responsif Mobile",    desc: "Akses penuh dari smartphone, tablet, atau desktop." },
  { icon: FaUsers,        title: "Multi-User & Peran", desc: "2 role tersedia: Teknisi (seluruh akses) dan Viewer (read-only untuk memantau data ternak)." },
  { icon: FaFileAlt,     title: "Log Aktivitas",       desc: "Catat semua kegiatan: vaksinasi, pemeriksaan, pengobatan." },
  { icon: FaClipboard,title: "Jadwal Vaksinasi",    desc: "Pengingat otomatis jadwal vaksinasi per sapi berikutnya." },
  { icon: FaShieldAlt,       title: "Data Aman",           desc: "Auth berbasis token, protected routes, dan localStorage." },
  { icon: FaBolt,          title: "Simulasi Real-time",  desc: "setInterval mensimulasikan perubahan suhu sensor setiap 8 detik." },
];

/* ════════════════════════════════════════════════════════════ */
export default function FeaturesPage() {
  return (
    <div className="landing-page">

      {/* ══════════════════════════════════════════════════════════
          HERO — image background with headline
          ══════════════════════════════════════════════════════════ */}
      <section className="relative h-80 overflow-hidden">
        <img src={IMG_VET} alt="Features" className="w-full h-full object-cover" />
        <div className="absolute inset-0 landing-hero-overlay" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm text-brand-sage mb-4">
            <FaBroadcastTower className="w-3.5 h-3.5" />
            Fitur Lengkap
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight uppercase tracking-tight">
            All <span className="text-brand-sage">Features</span>
          </h1>
          <p className="mt-4 text-stone-300 max-w-xl leading-relaxed">
            Dari monitoring suhu tubuh sapi hingga analitik machine learning — semua fitur yang Anda butuhkan dalam satu platform.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SERVICE CARDS — portrait image grid
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-section-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-brand-forest dark:text-brand-forest text-sm font-medium uppercase tracking-widest">Modul Utama</span>
              <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                4 Modul Inti<br />T-Cow°
              </h2>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xs leading-relaxed">
              Setiap modul saling terhubung untuk memberikan gambaran kesehatan sapi yang komprehensif dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCards.map((s) => (
              <div key={s.title} className="group relative overflow-hidden rounded-2xl aspect-3/4">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MAIN FEATURES — alternating 2-col
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-24">
          {mainFeatures.map((feat, idx) => (
            <div
              key={feat.id}
              className={`grid lg:grid-cols-2 gap-14 items-center ${idx % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              {/* Text side */}
              <div className={`space-y-6 ${idx % 2 === 1 ? "lg:order-2" : ""}`}>
                {/* Badge */}
                <div className={`inline-flex items-center gap-2 ${feat.color} rounded-full px-4 py-1.5`}>
                  <feat.icon className={`w-4 h-4 ${feat.iconColor}`} />
                  <span className={`text-sm font-semibold ${feat.iconColor}`}>{feat.badge}</span>
                </div>

                <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight">{feat.title}</h2>
                <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{feat.desc}</p>

                {/* Point list */}
                <ul className="space-y-3">
                  {feat.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <FaCheckCircle className="w-4 h-4 text-brand-forest shrink-0 mt-0.5" />
                      <span className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-brand-forest hover:bg-brand-sage text-white px-6 py-3 rounded-full font-semibold transition-colors text-sm"
                >
                  Coba Sekarang <FaArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Image side */}
              <div className={idx % 2 === 1 ? "lg:order-1" : ""}>
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img src={feat.img} alt={feat.title} className="w-full h-80 object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  {/* Floating badge on image */}
                  <div className="absolute bottom-4 left-4 bg-white dark:bg-stone-900 rounded-xl px-4 py-2.5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-forest rounded-full animate-pulse" />
                      <span className="text-stone-700 dark:text-stone-300 text-xs font-semibold">{feat.badge} — Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          ADDITIONAL FEATURES — 3-col grid
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 landing-section-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-brand-sage dark:text-brand-accent text-sm font-medium uppercase tracking-widest">Fitur Tambahan</span>
            <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100">Dan Masih Banyak Lagi</h2>
            <p className="mt-3 text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              T-Cow° terus berkembang dengan fitur-fitur baru yang memudahkan pengelolaan peternakan sapi sehari-hari.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {additionalFeatures.map((feat, i) => (
              <div
                key={feat.title}
                className={`group p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  i === 0
                    ? "bg-brand-forest border-brand-forest"
                    : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-brand-sage dark:hover:border-brand-sage/60"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  i === 0 ? "bg-brand-forest" : "bg-brand-accent-soft dark:bg-brand-forest/30"
                }`}>
                  <feat.icon className={`w-5 h-5 ${i === 0 ? "text-white" : "text-brand-sage dark:text-brand-accent"}`} />
                </div>
                <h3 className={`font-bold mb-2 ${i === 0 ? "text-white" : "text-stone-800 dark:text-stone-200"}`}>{feat.title}</h3>
                <p className={`text-sm leading-relaxed ${i === 0 ? "text-brand-cream/70" : "text-stone-500 dark:text-stone-400"}`}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA — dark emerald section
          ════════════════════════════════════════════════════════ */}
      <section className="py-20 landing-section-dark">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <span className="landing-eyebrow-on-dark">Transformasi Digital</span>
          <h2 className="mt-3 text-4xl font-bold text-white leading-tight">
            Siap Memanfaatkan Semua Fitur T-Cow°?
          </h2>
          <p className="mt-4 text-brand-cream/80 leading-relaxed max-w-xl mx-auto">
            Mulai pantau kesehatan sapi Anda hari ini. Daftar gratis dan coba semua fitur platform T-Cow°.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="landing-btn-accent"
            >
              Daftar Gratis <FaArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="border border-brand-cream/40 hover:border-brand-accent text-brand-cream hover:text-brand-forest px-8 py-3.5 rounded-full font-medium transition-all"
            >
              Login Demo
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-5 text-brand-cream/80 text-sm">
            {["Tanpa biaya setup", "Data aman", "Update gratis", "Dukungan 24/7"].map((item) => (
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
