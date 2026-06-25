"use client";

import Link from "next/link";
import {
  FaArrowRight, FaBullseye, FaGlobe, FaLightbulb, FaLeaf,
  FaCheckCircle, FaBrain,
} from "react-icons/fa";

const IMG_WIDE   = "https://images.unsplash.com/photo-1670586751538-497f3af8af97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXR0bGUlMjBmYXJtJTIwd2lkZSUyMGdyZWVuJTIwbGFuZHNjYXBlJTIwSW5kb25lc2lhfGVufDF8fHx8MTc3NzEwNTAwNXww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_SENSOR = "https://images.unsplash.com/photo-1762381650890-43b1030fc842?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3clMjBlYXIlMjB0YWclMjBJb1QlMjB3ZWFyYWJsZSUyMHNlbnNvciUyMGNvbHNlJTIwdXB8ZW58MXx8fHwxNzc3MTA1MDA2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_TEAM   = "https://images.unsplash.com/photo-1581092336210-c892d7da9690?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRlY2hub2xvZ3klMjBpbm5vdmF0aW9uJTIwc3RhcnR1cCUyMHRlYW18ZW58MXx8fHwxNzc3MTA1MDExfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_VET    = "https://images.unsplash.com/photo-1761872936268-b6aea93552a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBmYXJtZXIlMjB3b3JraW5nJTIwY2F0dGxlJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzcxMDUwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_HERD   = "https://images.unsplash.com/photo-1691886789655-0c71dbd54044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYWlyeSUyMGNvdyUyMGhlcmQlMjBncmVlbiUyMHBhc3R1cmV8ZW58MXx8fHwxNzc3MTA0MDczfDA&ixlib=rb-4.1.0&q=80&w=1080";

const goals = [
  {
    icon: FaBullseye,
    title: "Deteksi Dini Penyakit",
    desc: "Memantau suhu tubuh sapi secara real-time untuk mendeteksi penyakit muncul.",
    accent: "bg-brand-forest/10 text-brand-forest",
  },
  {
    icon: FaBrain,
    title: "Machine Learning Ready",
    desc: "Data suhu 7 hari disiapkan sebagai dataset terstruktur untuk melatih model prediksi kesehatan.",
    accent: "bg-brand-sage/10 text-brand-sage",
  },
  {
    icon: FaGlobe,
    title: "Pertanian Berkelanjutan",
    desc: "Mendukung praktik peternakan ramah lingkungan melalui manajemen sumber daya yang efisien.",
    accent: "bg-brand-tan/10 text-brand-tan",
  },
  {
    icon: FaLightbulb,
    title: "Inovasi Teknologi",
    desc: "Mengintegrasikan IoT, analitik data, dan ML untuk transformasi digital sektor peternakan.",
    accent: "bg-brand-accent/10 text-brand-accent",
  },
];

const team = [
  { name: "Seluruh Anggota X(6X+2Y)", role: "IoT Engineer, Web Developer, Data Analyst & ML",  initials: "01", color: "from-brand-forest to-teal-600" },
  { name: "Program Studi Teknologi Manajemen Ternak",   role: "Ahli Peternakan Sapi",           initials: "02", color: "from-blue-500 to-indigo-600" },
  { name: "Faldiena Marcelita, S.T., M.Kom. & Shelvie Nidya Neyman, S.Kom, M.Si.",       role: "Dosen Pembimbing",      initials: "03", color: "from-violet-500 to-purple-600" },
];

export default function AboutPage() {
  return (
    <div className="landing-page">
      <section className="relative h-80 overflow-hidden">
        <img src={IMG_WIDE} alt="Farm landscape" className="w-full h-full object-cover" />
        <div className="absolute inset-0 landing-hero-overlay" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm text-brand-sage mb-4">
            <FaLeaf className="w-3.5 h-3.5" />
            Tentang T-Cow°
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight uppercase tracking-tight">
            About <span className="text-brand-accent">T-Cow°</span>
          </h1>
          <p className="mt-4 text-stone-300 max-w-xl leading-relaxed">
            T-Cow° menggabungkan sensor wearable IoT dengan Website Monitoring untuk membantu peternak membuat keputusan berbasis data dan Machine Learing yang lebih baik.
          </p>
        </div>
      </section>

      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 border border-stone-200 dark:border-stone-700 rounded-full px-4 py-1 text-sm text-brand-forest font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-forest" />
                Misi &amp; Visi
              </div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Inovasi untuk Masa Depan Peternakan Indonesia
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                T-Cow° lahir dari kebutuhan nyata peternak sapi di Kandang Mitra kami yaitu Program Studi Teknologi Manajemen Ternak yang ingin memantau Kesehatan sapi secara real-time. Kami mengintegrasikan sensor wearable IoT, analisis data real-time, dan machine learning ke dalam Website Monitoring yang mudah digunakan.
              </p>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                Ear-tag kami merekam suhu tubuh sapi setiap saat. Data ini tidak hanya membantu deteksi dini penyakit, tetapi juga menjadi dataset berharga untuk melatih model prediksi kesehatan berbasis machine learning.
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

      <section className="py-16 bg-brand-forest dark:bg-brand-forest">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {[
              { val: "2026",  label: "Tahun Berdiri" },
              { val: "1+",   label: "Kandang Aktif" },
              { val: "10+",  label: "Sapi Terpantau" },
              { val: "99.9%", label: "Data Real-time" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold">{s.val}</p>
                <p className="text-brand-cream/80 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 landing-section-alt">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-brand-forest dark:text-brand-forest text-sm font-medium uppercase tracking-widest">Tujuan Kami</span>
            <h2 className="mt-2 text-xl font-bold text-stone-900 dark:text-stone-100">Apa yang Ingin Kami Capai?</h2>
            <p className="mt-3 text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              Setiap fitur T-Cow° dirancang dengan tujuan spesifik untuk meningkatkan kesehatan ternak serta efisiensi dan inovasi teknologi di bidang peternakan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {goals.map((g) => (
              <div
                key={g.title}
                className="group p-6 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 transition-all hover:-translate-y-1 hover:shadow-xl cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${g.accent} ring-1 ring-current/10`}>
                  <g.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2 text-stone-900 dark:text-stone-100">{g.title}</h3>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 landing-page">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <img src={IMG_TEAM} alt="Tim T-Cow°" className="w-full h-80 object-cover rounded-2xl shadow-xl" />
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-brand-forest dark:text-brand-forest text-sm font-medium uppercase tracking-widest">Tim Kami</span>
                <h2 className="mt-2 text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  Mari Mengenal Orang-orang Hebat di Balik T-Cow°
                </h2>
                <p className="mt-4 text-stone-500 dark:text-stone-400 leading-relaxed text-justify">
                  Kami adalah tim lintas Program Studi antara Teknologi Rekayasa Komputer dan Teknologi Manajemen Ternak. Perpaduan yang menggabungkan keahlian Rekayasa IoT, Analisis data, Machine learning, Pengembangan Website, dan Peternakan Sapi.
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
                <p className="text-stone-400 text-xs text-justify">{m.role}</p>
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

      <section className="py-20 landing-section-dark">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <span className="landing-eyebrow-on-dark">Mulai Sekarang</span>
          <h2 className="mt-3 text-xl font-bold text-white">
            Tertarik Menggunakan T-Cow°?
          </h2>
          <p className="mt-4 text-brand-cream/80 max-w-xl mx-auto leading-relaxed">
            Gunakan T-Cow° untuk meningkatkan produktivitas dan kesehatan ternak Anda.
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
            {["Tanpa biaya setup", "Data aman", "Mudah digunakan", "Dukungan 24/7"].map((item) => (
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
