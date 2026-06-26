"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaWrench, FaUsers, FaBell, FaMoon, FaSun, FaSignOutAlt, FaChevronRight, FaChevronDown, FaCog, FaExclamationTriangle, FaExclamationCircle, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineMonitorHeart } from "react-icons/md";
import { GiCow } from "react-icons/gi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ReadOnlyProvider } from "@/context/ReadOnlyContext";
import type { DashboardAlert } from "@/lib/dashboard";
import { TCowLogo } from "@/components/ui/TCowLogo";
import { RealtimeClock } from "@/components/ui/RealtimeClock";
import { swalSuccess } from "@/lib/swal";
import { useNotifications } from "@/hooks/useNotifications";

interface NavItem {
  href: string;
  icon: React.ElementType | null;
  mobileIcon?: React.ElementType;
  label: string;
  isMain?: boolean;
  exact?: boolean;
  isSubmenu?: boolean;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const teknisiNavItems = [
    { href: "/dashboard", icon: null, mobileIcon: LuLayoutDashboard, label: "Dashboard", isMain: true, exact: true },
    { href: "/dashboard/cattle", icon: GiCow, label: "Manajemen Sapi", isSubmenu: true },
    { href: "/dashboard/sensors", icon: MdOutlineMonitorHeart, label: "Monitoring Sapi", isSubmenu: true },
    { href: "/dashboard/maintenance", icon: FaWrench, label: "Perawatan", isSubmenu: true },
    { href: "/dashboard/admin", icon: FaUsers, label: "Pengguna", isSubmenu: true },
  ];

  const peternakNavItems = [
    { href: "/dashboard", icon: null, mobileIcon: LuLayoutDashboard, label: "Dashboard", isMain: true, exact: true },
    { href: "/dashboard/cattle", icon: GiCow, label: "Manajemen Sapi", isSubmenu: true },
    { href: "/dashboard/sensors", icon: MdOutlineMonitorHeart, label: "Monitoring Sapi", isSubmenu: true },
    { href: "/dashboard/maintenance", icon: FaWrench, label: "Maintenance Sistem", isSubmenu: true },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { dashboardAlerts: notifAlerts, loading: notifLoading } = useNotifications(30000);
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { isDark, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const navItems = user?.role === "Teknisi" ? teknisiNavItems : peternakNavItems;
  const unreadAlerts = notifAlerts.filter((a) => !a.read).length;
  
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = () => {
    logout();
    swalSuccess("Berhasil", "Berhasil keluar");
    router.push("/login");
  };

  useEffect(() => {
    setNotifOpen(false);
    setUserOpen(false);
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const activeIndex = navItems.findIndex(item => isActive(item.href, item.exact));

  return (
    <div className="flex h-screen bg-[#e5d7c4]/30 dark:bg-[#1a2114] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}     
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-[#f0f4e8] dark:bg-[#232b1c] border-r border-[#e5d7c4]/20 dark:border-[#354024]/30 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="py-2 px-2 shrink-0 border-b-4 rounded-b-2xl border-[#e5d7c4]/20 dark:border-[#354024]/30 relative">
          <div className="flex flex-col py-4 px-4 gap-3 rounded-full bg-[#edf4e8] dark:bg-[#232b1c] backdrop-blur-md">
            <div className="text-left">
              <p className="text-sm font-semibold text-[#2a331a] dark:text-[#889063]">
                Selamat datang, <span className="font-serif px-3 bg-[#354024]/10 dark:bg-[#54cd19]/10 rounded-full font-semibold text-[#354024] dark:text-[#54cd19]"> {user?.name?.trim() ? user.name.split(/\s+/)[0] : "Pengguna"}</span>
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.filter(item => item.isMain).map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link className={`flex items-center gap-3 px-3 py-3 rounded-full text-sm font-semibold transition-all group ${active ? "bg-[#354024] text-white shadow-lg" : "text-stone-700 dark:text-stone-300 hover:bg-[#e5d7c4]/30 dark:hover:bg-[#354024]/20 hover:text-[#354024] dark:hover:text-[#54cd19]"}`} key={item.href} href={item.href} >
                {(() => {
                  const Icon = item.icon;
                  return Icon ? <Icon className="w-6 h-6" /> : null;
                })()}
                {item.label}
              </Link>
            );
          })}
          <div className="border-t border-[#e5d7c4]/20 dark:border-[#354024]/30 my-3" />
          <div className="space-y-1">
            <p className="px-3 text-xs font-medium text-stone-500 dark:text-[#cfbb99] uppercase tracking-wider">
              Menu Dashboard
            </p>
            {navItems.filter(item => item.isSubmenu).map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-all group ${active ? "bg-[#354024] text-white shadow-lg" : "text-stone-700 dark:text-stone-300 hover:bg-[#e5d7c4]/30 dark:hover:bg-[#354024]/20 hover:text-[#354024] dark:hover:text-[#54cd19]"}`}>
                  {(() => {
                    const Icon = item.icon;
                    return Icon ? <Icon className="w-4 h-4" /> : null;
                  })()}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="p-8 rounded-t-full flex items-center justify-center border-t-4 border-[#e5d7c4]/20 dark:border-[#354024]/30">
          <div className="flex flex-col items-center gap-7 text-center">
            <div className="w-12 h-12 bg-[#55cd1986] rounded-full shadow-xl border-b-2 flex items-center justify-center">
              <TCowLogo className="w-8 h-8" />
            </div>
            <div className="text-[#354024] dark:text-[#54cd19] font-semibold text-md leading-tight">
              T-Cow°
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#f0f4e8] dark:bg-[#232b1c] border-b border-[#e5d7c4]/20 dark:border-[#354024]/30 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden py-4 border-t border-[#e5d7c4]/20 dark:border-[#354024]/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 border-r-2 border-[#55cd1986] rounded-t-full flex items-center justify-center">
                  <TCowLogo className="w-4 h-4" />
                </div>
                <div className=" text-[#354024] dark:text-[#54cd19] font-semibold text-sm leading-tight">
                  T-Cow°
                </div>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-stone-500 dark:text-[#cfbb99]">
              {pathname === "/dashboard" ? (
                <span className="text-[#354024] dark:text-[#e5d7c4] font-medium">Dashboard</span>
              ) : (
                (() => {
                  const mainItem = navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
                  const isFaCogPage = pathname === "/dashboard/settings";
                  if (isFaCogPage) {
                    return <span className="text-[#354024] dark:text-[#e5d7c4] font-medium">Pengaturan</span>;
                  }

                  if (mainItem) {
                    return (
                      <>
                        <Link href="/dashboard" className="hover:text-[#54cd19] transition-colors">Dashboard</Link>
                        <FaChevronRight className="w-4 h-4" />
                        <span className="text-[#354024] dark:text-[#e5d7c4] font-medium">{mainItem.label}</span>
                      </>
                    );
                  }
                  return <span className="text-[#354024] dark:text-[#e5d7c4] font-medium">Dashboard</span>;
                })()
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:block">
              <RealtimeClock />
            </div>
            <button className="p-2 rounded-full text-stone-500 hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors" onClick={toggleTheme} suppressHydrationWarning>
              {mounted ? (isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />) : <div className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button className="p-2 rounded-full text-stone-500 hover:text-[#354024] dark:text-[#cfbb99] dark:hover:text-[#e5d7c4] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors relative" onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }} suppressHydrationWarning>
                <FaBell className="w-5 h-5" />
                {unreadAlerts > 0 && (<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />)}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#232b1c] border border-[#e5d7c4]/20 dark:border-[#354024]/30 rounded-[20px] shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5d7c4]/20 dark:border-[#354024]/30">
                    <span className="font-medium text-[#354024] dark:text-[#e5d7c4] text-sm">Notifikasi</span>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{unreadAlerts} baru</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#e5d7c4]/20 dark:divide-[#354024]/30">
                    {notifAlerts.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-stone-400 mt-1">
                          {notifLoading ? "Memuat notifikasi..." : "Tidak ada notifikasi kesehatan"}
                        </p>
                      </div>
                    ) : (
                      notifAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className={`px-4 py-3 hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors ${!alert.read ? "bg-[#54cd19]/10 dark:bg-[#54cd19]/5" : ""}`}>
                          <div className="flex gap-2 items-start">
                            <span className="text-base mt-0.5">
                              {alert.type === "danger" ? (
                                <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                              ) : alert.type === "warning" ? (
                                <FaExclamationCircle className="w-5 h-5 text-yellow-500" />
                              ) : (
                                <FaInfoCircle className="w-5 h-5 text-blue-500" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#354024] dark:text-[#e5d7c4]">{alert.title}</p>
                              <p className="text-xs text-stone-500 dark:text-[#cfbb99] mt-0.5 leading-relaxed">{alert.message}</p>
                              <p className="text-xs text-stone-400 dark:text-[#cfbb99] mt-1">{alert.time}</p>
                            </div>
                            {!alert.read && <div className="w-2 h-2 bg-[#54cd19] rounded-full mt-1.5 shrink-0" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-[#e5d7c4]/20 dark:border-[#354024]/30">
                    <button className="w-full py-1 text-xs text-[#54cd19] dark:text-[#889063] hover:underline text-center">Lihat semua notifikasi</button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }} className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-full hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors" suppressHydrationWarning>
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user?.name ?? "User"}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-[#54cd19]/30 dark:border-[#54cd19]/40 shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 sm:w-9 sm:h-9 bg-[#54cd19] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${user?.image ? "hidden" : ""}`}>
                  {user?.name?.charAt(0) ?? "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[#354024] dark:text-[#e5d7c4] max-w-24 truncate">{user?.name}</span>
                <FaChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#232b1c] border border-[#e5d7c4]/20 dark:border-[#354024]/30 rounded-[20px] shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-[#e5d7c4]/20 dark:border-[#354024]/30">
                    <p className="font-medium text-[#354024] dark:text-[#e5d7c4] text-sm">{user?.name}</p>
                    <p className="text-xs text-stone-400 dark:text-[#cfbb99] truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs bg-[#54cd19]/20 dark:bg-[#54cd19]/10 text-[#354024] dark:text-[#54cd19] px-2 py-0.5 rounded-full">{user?.role}</span>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard/settings" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-stone-600 dark:text-[#cfbb99] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors">
                      <FaCog className="w-4 h-4" /> Pengaturan
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <FaSignOutAlt className="w-4 h-4" /> Keluar
                    </button>
                    <div className="lg:hidden px-4 py-2 bg-stone-50 dark:bg-black/10 border-b border-[#e5d7c4]/20 dark:border-[#354024]/30 right-0 scale-90 origin-center">
                      <RealtimeClock />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 scrollbar-hide">
          <ReadOnlyProvider>
            {children}
          </ReadOnlyProvider>
        </main>
      </div>
      
      <nav className="lg:hidden fixed bottom-3 left-2 right-2 z-40 h-14 bg-[#f0f4e8] dark:bg-[#232b1c] border border-[#e5d7c4]/20 dark:border-[#354024]/30 rounded-[20px] shadow-xl px-1">
        <div className="relative w-full h-full flex items-center justify-between">          
          {activeIndex !== -1 && (
            <div className="absolute top-0 h-11 w-11 rounded-full bg-[#54cd19] shadow-lg border-4 border-[#e5d7c4]/30 dark:border-[#1a2114] flex items-center justify-center -mt-4.5 z-10 transition-all duration-300 ease-out"
              style={{
                left: `calc(${(activeIndex / navItems.length) * 100}% + (${100 / navItems.length}% - 2.75rem) / 2)`
              }}
            >
              {(() => {
                const activeItem = navItems[activeIndex];
                const Icon = activeItem?.mobileIcon || activeItem?.icon;
                return Icon ? <Icon className="w-4.5 h-4.5 text-white" /> : null;
              })()}
            </div>
          )}

          {navItems.map((item, index) => {
            const active = index === activeIndex;
            return (
              <div key={item.href} className="flex-1 h-full relative flex items-center justify-center">
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center w-full h-full z-20 text-stone-500 dark:text-[#cfbb99]"
                >
                  {!active && (
                    <>
                      {(() => {
                        const Icon = item.mobileIcon || item.icon;
                        return Icon ? <Icon className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity" /> : null;
                      })()}
                    </>
                  )}
                  {active && (
                    <span className="text-[11px] font-bold mt-7 text-[#354024] dark:text-[#54cd19] tracking-tighter truncate max-w-full px-0.5 transition-all duration-300">
                      {item.label.split(' ')[0]}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}