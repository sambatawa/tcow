"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaMoon, FaSun, FaChevronRight } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TCowLogo } from "@/components/ui/TCowLogo";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) setScrolled(true);
  }, [isHome]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/features", label: "Fitur" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const transparent = isHome && !scrolled;
  const logoText = transparent ? "text-white" : "text-brand-forest dark:text-brand-accent";
  const linkBase = transparent ? "text-white/90 hover:text-white" : "text-brand-forest/80 dark:text-brand-cream/80 hover:text-brand-sage dark:hover:text-brand-accent";
  const linkActive = transparent ? "text-white font-semibold" : "text-brand-sage dark:text-brand-accent font-semibold";
  const iconBtn = transparent ? "text-white/90 hover:text-white hover:bg-white/10" : "text-stone-600 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800";
  const mobileBtn = transparent ? "text-white hover:bg-white/10" : "text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800";

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream/40 dark:bg-[#1a2114]">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 bg-transparent border-transparent">
        <div className="max-w-9xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${transparent ? "bg-brand-accent" : "bg-brand-forest"}`}>
                  <TCowLogo className="w-5 h-5" />
                </div>
                <span className={`font-extrabold text-base tracking-tight transition-colors ${logoText}`}>
                  T-Cow°
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8 backdrop-blur-sm bg-white/20 px-10 py-2 rounded-full shadow-md">
              {navLinks.map((link, i) => (
                <Link
                  key={`${link.href}-${i}`}
                  href={link.href}
                  className={`text-sm transition-colors ${isActive(link.href) ? linkActive : linkBase}`}
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
            <div className="md:hidden bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <Link
                  key={`mob-${link.href}-${i}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-brand-accent-soft dark:bg-brand-forest/40 text-brand-forest dark:text-brand-accent font-semibold"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 px-4 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-400">
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
                Platform monitoring kesehatan sapi modern berbasis sensor IoT wearable — suhu tubuh, rekam medis, vaksinasi, semua dalam satu dasbor.
              </p>
              <div className="flex gap-3 mt-5">
                {["F", "T", "I", "Y"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="w-8 h-8 rounded-full bg-brand-sage/40 hover:bg-brand-accent flex items-center justify-center transition-colors text-xs font-bold text-brand-cream"
                  >
                    {s}
                  </a>
                ))}
              </div>
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
                <li className="flex items-start gap-2"><span>📍</span><span>Jl. Raya Peternakan No. 42, Bandung</span></li>
                <li className="flex items-center gap-2"><span>📞</span><span>(022) 123-4567</span></li>
                <li className="flex items-center gap-2"><span>✉️</span><span>info@cowmanager.id</span></li>
                <li className="flex items-center gap-2"><span>🕒</span><span>Senin–Jumat, 08.00–17.00 WIB</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-700/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <p>© 2025 T-Cow° — Smart Cattle Health Monitoring System. Hak cipta dilindungi.</p>
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
