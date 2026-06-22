"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaMoon, FaSun, FaChevronRight } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TCowLogo } from "@/components/ui/TCowLogo";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const isHome = pathname === "/";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const logoText = "text-brand-forest dark:text-brand-accent";
  const linkBase = "text-brand-forest/75 dark:text-brand-cream/75 hover:text-brand-forest dark:hover:text-brand-accent hover:bg-brand-forest/5 dark:hover:bg-brand-accent/10";
  const linkActive = "bg-brand-forest text-white dark:bg-brand-accent dark:text-brand-forest shadow-sm font-semibold";
  const iconBtn = "text-brand-forest/75 hover:text-brand-forest dark:text-brand-cream/75 dark:hover:text-brand-accent hover:bg-brand-forest/5 dark:hover:bg-brand-accent/10";
  const mobileBtn = "text-brand-forest/75 hover:text-brand-forest dark:text-brand-cream/75 dark:hover:text-brand-accent hover:bg-brand-forest/5 dark:hover:bg-brand-accent/10";

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream/40 dark:bg-[#1a2114]">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-forest/10 dark:border-brand-accent/15 bg-white/85 dark:bg-[#1a2114]/90 backdrop-blur-xl shadow-sm transition-colors duration-300">
        <div className="max-w-9xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-forest dark:bg-brand-accent transition-colors">
                  <TCowLogo className="w-5 h-5" />
                </div>
                <span className={`font-extrabold text-base tracking-tight transition-colors ${logoText}`}>
                  T-Cow°
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-1 rounded-full border border-brand-forest/10 dark:border-brand-accent/15 bg-brand-cream/80 dark:bg-brand-forest/25 px-1.5 py-1.5 shadow-sm">
              {navLinks.map((link, i) => (
                <Link
                  key={`${link.href}-${i}`}
                  href={link.href}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${isActive(link.href) ? linkActive : linkBase}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${iconBtn}`}
                aria-label="Toggle theme"
              >
                {isDark ? <FaSun className="w-4.5 h-4.5" /> : <FaMoon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 bg-brand-accent hover:bg-brand-accent/90 text-brand-forest px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                >
                  Dashboard
                  <FaChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="flex items-center gap-1 bg-brand-accent hover:bg-brand-accent/90 text-brand-forest px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                >
                  Daftar
                  <FaChevronRight className="w-4 h-4" />
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                className={`md:hidden p-2 rounded-lg transition-colors ${mobileBtn}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden mt-2 rounded-2xl border border-brand-forest/10 dark:border-brand-accent/15 bg-white/95 dark:bg-[#1a2114]/95 p-3 shadow-lg space-y-1">
              {navLinks.map((link, i) => (
                <Link
                  key={`mob-${link.href}-${i}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-brand-forest text-white dark:bg-brand-accent dark:text-brand-forest font-semibold"
                      : "text-brand-forest/75 dark:text-brand-cream/75 hover:bg-brand-forest/5 dark:hover:bg-brand-accent/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 px-4 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-2.5 rounded-xl border border-brand-forest/15 dark:border-brand-accent/20 text-sm text-brand-forest/75 dark:text-brand-cream/75">
                  Masuk
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="text-center py-2.5 rounded-xl bg-brand-accent text-brand-forest text-sm font-semibold">
                  Daftar Gratis
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page content — no top padding on home (hero is full screen) */}
      <main className={`flex-1 ${isHome ? "" : "pt-16"}`}>
        {children}
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="bg-brand-forest text-brand-cream/90 py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                  <TCowLogo className="w-4 h-4" />
                </div>
                <span className="text-white font-extrabold text-lg tracking-tight">T-Cow°</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
                Platform monitoring kesehatan sapi modern Smart Eartag berbasis Internet of Things (IoT) dan machine learning yang dirancang untuk memantau suhu tubuh sapi secara real-time. 
              </p>
            </div>

            {/* Navigasi */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Navigasi</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: "/", label: "Beranda" },
                  { href: "/about", label: "Tentang" },
                  { href: "/features", label: "Fitur" },
                  { href: "/login", label: "Login" },
                  { href: "/register", label: "Daftar" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-brand-accent transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Kontak</h4>
              <ul className="space-y-2.5 text-sm text-stone-400">
                <li className="flex items-start gap-2"><span>📍</span><span>Jl. Kumbang No.14, RT.02/RW.06, Babakan, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16128</span></li>
                <li className="flex items-center gap-2"><span>📞</span><span>(0251) 8329101</span></li>
                <li className="flex items-center gap-2"><span>✉️</span><span>@peternakanvokasiipb</span></li>
                <li className="flex items-center gap-2"><span>🕒</span><span>Senin–Jumat, 08.00–17.00 WIB</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-700/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <p>© 2026 T-Cow° : Temperature Cow Celcius. Hak cipta dilindungi.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-stone-300 transition-colors">Privasi</a>
              <a href="#" className="hover:text-stone-300 transition-colors">Syarat</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
