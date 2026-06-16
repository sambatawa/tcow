"use client";

import Link from "next/link";
import {
  FaArrowRight, FaBullseye, FaGlobe, FaLightbulb, FaLeaf,
  FaCheckCircle, FaBrain,
} from "react-icons/fa";

/* ── Images ─────────────────────────────────────────────────────────── */
const IMG_WIDE   = "https://images.unsplash.com/photo-1670586751538-497f3af8af97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXR0bGUlMjBmYXJtJTIwd2lkZSUyMGdyZWVuJTIwbGFuZHNjYXBlJTIwSW5kb25lc2lhfGVufDF8fHx8MTc3NzEwNTAwNXww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_SENSOR = "https://images.unsplash.com/photo-1762381650890-43b1030fc842?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3clMjBlYXIlMjB0YWclMjBJb1QlMjB3ZWFyYWJsZSUyMHNlbnNvciUyMGNvbHNlJTIwdXB8ZW58MXx8fHwxNzc3MTA1MDA2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_TEAM   = "https://images.unsplash.com/photo-1581092336210-c892d7da9690?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRlY2hub2xvZ3klMjBpbm5vdmF0aW9uJTIwc3RhcnR1cCUyMHRlYW18ZW58MXx8fHwxNzc3MTA1MDExfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_VET    = "https://images.unsplash.com/photo-1761872936268-b6aea93552a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBmYXJtZXIlMjB3b3JraW5nJTIwY2F0dGxlJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzcxMDUwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_HERD   = "https://images.unsplash.com/photo-1691886789655-0c71dbd54044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYWlyeSUyMGNvdyUyMGhlcmQlMjBncmVlbiUyMHBhc3R1cmV8ZW58MXx8fHwxNzc3MTA0MDczfDA&ixlib=rb-4.1.0&q=80&w=1080";

/* ── Data ───────────────────────────────────────────────────────────── */
const goals = [
  {
    icon: FaBullseye,
    title: "Deteksi Dini Penyakit",
    desc: "Memantau suhu tubuh sapi secara kontinu untuk mendeteksi anomali sebelum gejala klinis muncul.",
    color: "bg-brand-forest/10 dark:bg-brand-forest/20 text-brand-forest dark:text-brand-forest",
  },
  {
    icon: FaBrain,
    title: "Machine Learning Ready",
    desc: "Data suhu 7 hari disiapkan sebagai dataset terstruktur untuk melatih model prediksi kesehatan.",
    color: "bg-brand-sage-soft dark:bg-brand-forest/30 text-brand-sage dark:text-brand-cream",
  },
  {
    icon: FaGlobe,
    title: "Pertanian Berkelanjutan",
    desc: "Mendukung praktik peternakan ramah lingkungan melalui manajemen sumber daya yang efisien.",
    color: "bg-brand-tan-soft dark:bg-brand-forest/30 text-brand-forest dark:text-brand-tan",
  },
  {
    icon: FaLightbulb,
    title: "Inovasi Teknologi",
    desc: "Mengintegrasikan IoT, analitik data, dan AI untuk transformasi digital sektor peternakan.",
    color: "bg-brand-forest/10 dark:bg-brand-forest/20 text-brand-forest dark:text-brand-forest",
  },
];

const team = [
  { name: "Dr. Ahmad Fauzi", role: "Ahli Peternakan Sapi",  initials: "AF", color: "from-brand-forest to-teal-600" },
  { name: "Rizki Pratama",   role: "IoT Engineer",           initials: "RP", color: "from-blue-500 to-indigo-600" },
  { name: "Sari Dewi",       role: "Data Analyst & ML",      initials: "SD", color: "from-violet-500 to-purple-600" },
  { name: "Budi Santoso",    role: "Full-stack Developer",   initials: "BS", color: "from-amber-500 to-orange-600" },
];

/* ════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  return (
    <div className="landing-page">

      {/* HERO */}
      <section className="relative h-80 overflow-hidden">
        <img src={IMG_WIDE} alt="Farm landscape" className="w-full h-full object-cover" />
        <div className="absolute inset-0 landing-hero-overlay" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm text-brand-sage mb-4">
            <FaLeaf className="w-3.5 h-3.5" />
            Tentang CowManager
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight uppercase tracking-tight">
            About <span className="text-brand-accent">CowManager</span>
          </h1>
          <p className="mt-4 text-stone-300 max-w-xl leading-relaxed">
            Platform monitoring kesehatan sapi berbasis sensor IoT wearable — dibangun untuk peternak modern yang percaya pada data.
          </p>
        </div>
      </section>

      {/* MISI & VISI */}
      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 border border-stone-200 dark:border-stone-700 rounded-full px-4 py-1 text-sm text-brand-forest font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-forest" />
                Misi &amp; Visi
              </div>
              <h2 className="text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Smart Farming untuk Masa Depan Peternakan Indonesia
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                CowManager lahir dari kebutuhan nyata para peternak sapi modern yang ingin mengelola ternak dengan lebih ilmiah. Kami mengintegrasikan sensor wearable IoT, analisis data real-time, dan machine learning ke dalam satu platform yang mudah digunakan.
              </p>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                Sensor collar dan ear-tag kami merekam suhu tubuh sapi setiap saat. Data ini tidak hanya membantu deteksi dini penyakit, tetapi juga menjadi dataset berharga untuk melatih model prediksi kesehatan berbasis machine learning.
              </p>
              <div className="space-y-3">
                {[
                  "Monitoring suhu tubuh 24/7 tanpa gangguan",
                  "Dataset siap pakai untuk machine learning",
                  "Alert otomatis saat suhu anomali terdeteksi",
                  "Rekam medis & vaksinasi terpusat",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <FaCheckCircle className="w-4 h-4 text-brand-forest shrink-0" />
                    <span className="text-stone-600 dark:text-stone-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img src={IMG_VET} alt="Veterinarian working" className="w-full h-72 object-cover rounded-2xl shadow-xl" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <img src={IMG_SENSOR} alt="IoT sensor" className="h-36 w-full object-cover rounded-xl" />
                <img src={IMG_HERD}   alt="Cattle herd" className="h-36 w-full object-cover rounded-xl" />
              </div>
              <div className="absolute top-4 -right-4 bg-white dark:bg-stone-900 rounded-2xl shadow-xl px-5 py-4 border border-stone-100 dark:border-stone-700">
                <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">98%</p>
                <p className="text-xs text-stone-500 mt-0.5">Kepuasan Pengguna</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="py-16 bg-brand-forest dark:bg-brand-forest">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {[
              { val: "2022",  label: "Tahun Berdiri" },
              { val: "50+",   label: "Farm Aktif" },
              { val: "500+",  label: "Sapi Terpantau" },
              { val: "99.9%", label: "Uptime Sistem" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold">{s.val}</p>
                <p className="text-brand-cream/80 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOALS */}
      <section className="py-24 landing-section-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-brand-forest dark:text-brand-forest text-sm font-medium uppercase tracking-widest">Tujuan Kami</span>
            <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100">Apa yang Ingin Kami Capai</h2>
            <p className="mt-3 text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              Setiap fitur CowManager dirancang dengan tujuan spesifik untuk meningkatkan kesehatan ternak dan efisiensi peternakan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {goals.map((g, i) => (
              <div
                key={g.title}
                className={`group p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-default ${
                  i === 0
                    ? "bg-brand-forest border-brand-forest"
                    : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-brand-forest dark:hover:border-brand-forest"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  i === 0 ? "bg-brand-forest" : g.color.split(" ")[0] + " " + g.color.split(" ")[1]
                }`}>
                  <g.icon className={`w-6 h-6 ${i === 0 ? "text-white" : g.color.split(" ").slice(2).join(" ")}`} />
                </div>
                <h3 className={`font-bold mb-2 ${i === 0 ? "text-white" : "text-stone-800 dark:text-stone-200"}`}>{g.title}</h3>
                <p className={`text-sm leading-relaxed ${i === 0 ? "text-brand-cream/80" : g.color.split(" ").slice(2).join(" ")}`}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <img src={IMG_TEAM} alt="Tim CowManager" className="w-full h-80 object-cover rounded-2xl shadow-xl" />
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-brand-forest dark:text-brand-forest text-sm font-medium uppercase tracking-widest">Tim Kami</span>
                <h2 className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  Orang-orang di Balik CowManager
                </h2>
                <p className="mt-4 text-stone-500 dark:text-stone-400 leading-relaxed">
                  Kami adalah tim lintas disiplin yang menggabungkan keahlian peternakan, rekayasa IoT, analisis data, dan pengembangan software.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {team.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-3 bg-stone-50 dark:bg-stone-900 rounded-xl p-4 border border-stone-100 dark:border-stone-700"
                  >
                    <div className={`w-10 h-10 bg-linear-to-br ${m.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {m.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">{m.name}</p>
                      <p className="text-stone-400 text-xs">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/features"
                className="inline-flex items-center gap-2 bg-brand-forest hover:bg-brand-sage text-white px-6 py-3 rounded-full font-semibold transition-colors text-sm"
              >
                Lihat Semua Fitur <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 landing-section-dark">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <span className="landing-eyebrow-on-dark">Mulai Sekarang</span>
          <h2 className="mt-3 text-4xl font-bold text-white">
            Tertarik Menggunakan CowManager?
          </h2>
          <p className="mt-4 text-brand-cream/80 max-w-xl mx-auto leading-relaxed">
            Daftarkan farm Anda dan mulai pantau kesehatan sapi dengan teknologi IoT wearable terkini. Gratis untuk memulai.
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
              className="border border-brand-cream/40 hover:border-brand-accent text-brand-cream hover:text-brand-forest px-8 py-3.5 rounded-full font-medium transition-all"
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
