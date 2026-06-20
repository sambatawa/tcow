"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaWrench, FaUsers, FaBell, FaMoon, FaSun, FaSignOutAlt, FaChevronRight, FaChevronDown, FaCog, FaExclamationTriangle, FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaBook, FaCamera } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineMonitorHeart } from "react-icons/md";
import { GiCow } from "react-icons/gi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { TCowLogo } from "@/components/ui/TCowLogo";
import type { DashboardAlert } from "@/lib/dashboard";
import { toast } from "sonner";
import { RealtimeClock } from "@/components/ui/RealtimeClock";


interface NavItem {
  href: string;
  icon: React.ElementType | null;
  mobileIcon?: React.ElementType;
  label: string;
  isMain?: boolean;
  exact?: boolean;
  isSubmenu?: boolean;
  submenu?: NavItem[];
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const teknisiNavItems = [
    { href: "/dashboard", icon: null, mobileIcon: LuLayoutDashboard, label: "Dashboard", isMain: true, exact: true },
    {
      href: "/dashboard/cattle", icon: GiCow, label: "Area Peternak", isSubmenu: true, submenu: [
        { href: "/dashboard/cattle", label: "Manajemen Sapi" },
        { href: "/dashboard/sensors", label: "Monitoring Sapi" }
      ]
    },
    { href: "/dashboard/scan", icon: FaCamera, mobileIcon: FaCamera, label: "Scan Kamera", isSubmenu: true },
    { href: "/dashboard/maintenance", icon: FaWrench, label: "Maintenance", isSubmenu: true },
    { href: "/dashboard/admin", icon: FaUsers, label: "Manajemen Pengguna", isSubmenu: true },
    { href: "/dashboard/config", icon: FaCog, label: "Manajemen Sistem", isSubmenu: true },
  ];
  const peternakNavItems = [
    { href: "/dashboard", icon: null, mobileIcon: LuLayoutDashboard, label: "Dashboard", isMain: true, exact: true },
    { href: "/dashboard/cattle", icon: GiCow, label: "Manajemen Sapi", isSubmenu: true },
    { href: "/dashboard/sensors", icon: MdOutlineMonitorHeart, label: "Monitoring Sapi", isSubmenu: true },
    { href: "/dashboard/scan", icon: FaCamera, mobileIcon: FaCamera, label: "Scan Kamera", isSubmenu: true },
    { href: "/dashboard/maintenance", icon: FaWrench, label: "Maintenance Sistem", isSubmenu: true },
  ];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [alertsData, setAlertsData] = useState<DashboardAlert[]>([]);
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { isDark, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const [dashRes, sensorRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/sensors"),
        ]);
        const merged: DashboardAlert[] = [];
        if (dashRes.ok) {
          const dash = (await dashRes.json()) as { alerts?: DashboardAlert[] };
          merged.push(...(dash.alerts ?? []));
        }
        if (sensorRes.ok) {
          const sensors = (await sensorRes.json()) as {
            alerts?: DashboardAlert[];
          };
          merged.push(...(sensors.alerts ?? []));
        }
        setAlertsData(merged.slice(0, 8));
      } catch {
        setAlertsData([]);
      }
    })();
  }, [isAuthenticated]);
  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel);
      } else {
        newSet.add(menuLabel);
      }
      return newSet;
    });
  };

  const navItems = user?.role === "Teknisi" ? teknisiNavItems : peternakNavItems;
  // Menghitung data item menu yang aktif untuk versi mobile (setelah difilter)
  const mobileNavItems = navItems;
  const unreadAlerts = alertsData.filter((a) => !a.read).length;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar. Sampai jumpa!");
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

  return (
    <div className="flex h-screen bg-[#e5d7c4]/30 dark:bg-[#1a2114] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />)
      }
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-[#f0f4e8] dark:bg-[#232b1c] border-r border-[#e5d7c4]/20 dark:border-[#354024]/30 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="py-2 px-2 shrink-0 border-b-4 rounded-b-2xl border-[#e5d7c4]/20 dark:border-[#354024]/30 relative">
          <div className="flex flex-col py-4 px-4 gap-3 rounded-b-4xl rounded-r-4xl bg-[#edf4e8] dark:bg-[#232b1c] backdrop-blur-md">
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
              <Link className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all group ${active ? "bg-[#354024] text-white shadow-lg" : "text-stone-700 dark:text-stone-300 hover:bg-[#e5d7c4]/30 dark:hover:bg-[#354024]/20 hover:text-[#354024] dark:hover:text-[#54cd19]"}`} key={item.href} href={item.href} >
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
              const hasSubmenu = 'submenu' in item && Array.isArray(item.submenu) && item.submenu.length > 0;
              const isExpanded = expandedMenus.has(item.label);
              return (
                <div key={item.href}>
                  {hasSubmenu ? (
                    <button onClick={() => toggleMenu(item.label)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${active ? "bg-[#e5d7c4]/20 dark:bg-[#354024]/30 text-[#354024] dark:text-[#e5d7c4] font-medium border-[#54cd19]"
                      : "text-[#354024] dark:text-[#e5d7c4] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 hover:text-[#54cd19] dark:hover:text-[#e5d7c4]"}`}>
                      {(() => {
                        const Icon = item.icon;
                        return Icon ? <Icon className="w-4 h-4" /> : null;
                      })()}
                      {item.label}
                      <FaChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${active ? "bg-[#e5d7c4]/20 dark:bg-[#354024]/30 text-[#354024] dark:text-[#e5d7c4] font-medium border-[#54cd19]"
                      : "text-stone-600 dark:text-[#cfbb99] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 hover:text-[#354024] dark:hover:text-[#e5d7c4]"}`}>
                      {(() => {
                        const Icon = item.icon;
                        return Icon ? <Icon className="w-4 h-4" /> : null;
                      })()}
                      {item.label}
                    </Link>
                  )}

                  {hasSubmenu && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {((item as any).submenu as NavItem[])?.map((subItem: NavItem) => (
                        <Link href={subItem.href} key={subItem.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive(subItem.href) ? "bg-[#54cd19]/20 dark:bg-[#54cd19]/10 text-[#354024] dark:text- font-medium"
                          : "text-stone-600 dark:text-[#cfbb99] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30"}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
                <div className="w-8 h-8 border-r-2 border-[#55cd1986] rounded-t-full shadow-md flex items-center justify-center">
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
                  const parentItem = navItems.find(item =>
                    'submenu' in item && !!item.submenu && Array.isArray(item.submenu) && (item.submenu as NavItem[]).some((sub: NavItem) => isActive(sub.href))) as (NavItem & { submenu: NavItem[] }) | undefined;
                  const subItem = parentItem ? (parentItem.submenu as NavItem[]).find((sub: NavItem) => isActive(sub.href)) : undefined;
                  const mainItem = navItems.find((n) => pathname === n.href);
                  const isFaCogPage = pathname === "/dashboard/settings";
                  if (isFaCogPage) {
                    return (
                      <>
                        <span className="text-[#354024] dark:text-[#e5d7c4] font-medium">Pengaturan</span>
                      </>
                    );
                  }

                  if (subItem && parentItem) {
                    return (
                      <>
                        <Link href="/dashboard" className="hover:text-[#54cd19] transition-colors">Dashboard</Link>
                        <FaChevronRight className="w-4 h-4" />
                        <Link href={parentItem.href} className="hover:text-[#54cd19] transition-colors">{parentItem.label}</Link>
                        <FaChevronRight className="w-4 h-4" />
                        <span className="text-[#354024] dark:text-[#e5d7c4] font-medium">{subItem.label}</span>
                      </>
                    );
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

          <div className="flex items-center gap-4">
            <RealtimeClock />

            <button className="p-2 rounded-lg text-stone-500 hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors" onClick={toggleTheme} suppressHydrationWarning>
              {mounted ? (isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />) : <div className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button className="p-2 rounded-lg text-stone-500 hover:text-[#354024] dark:text-[#cfbb99] dark:hover:text-[#e5d7c4] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors relative" onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }} suppressHydrationWarning>
                <FaBell className="w-5 h-5" />
                {unreadAlerts > 0 && (<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />)}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#232b1c] border border-[#e5d7c4]/20 dark:border-[#354024]/30 rounded-xl shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5d7c4]/20 dark:border-[#354024]/30">
                    <span className="font-medium text-[#354024] dark:text-[#e5d7c4] text-sm">
                      Notifikasi
                    </span>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                      {unreadAlerts} baru
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#e5d7c4]/20 dark:divide-[#354024]/30">
                    {alertsData.slice(0, 5).map((alert) => (
                      <div key={alert.id} className={`px-4 py-3 hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors ${!alert.read ? "bg-[#54cd19]/10 dark:bg-[#54cd19]/5" : ""}`}>
                        <div className="flex gap-2 items-start">
                          <span className="text-base mt-0.5">
                            {alert.type === "danger" ? (
                              <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                            ) : alert.type === "warning" ? (
                              <FaExclamationCircle className="w-5 h-5 text-yellow-500" />
                            ) : alert.type === "success" ? (
                              <FaCheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <FaInfoCircle className="w-5 h-5 text-blue-500" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#354024] dark:text-[#e5d7c4]">{alert.title}</p>
                            <p className="text-xs text-stone-500 dark:text-[#cfbb99] mt-0.5 leading-relaxed">{alert.message}</p>
                            <p className="text-xs text-stone-400 dark:text-[#cfbb99] mt-1">{alert.time}</p>
                          </div>
                          {!alert.read && (
                            <div className="w-2 h-2 bg-[#54cd19] rounded-full mt-1.5 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-[#e5d7c4]/20 dark:border-[#354024]/30">
                    <button className="w-full text-xs text-[#54cd19] dark:text-[#889063] hover:underline text-center">
                      Lihat semua notifikasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors" suppressHydrationWarning>
                <div className="w-7 h-7 bg-[#54cd19] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) ?? "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[#354024] dark:text-[#e5d7c4] max-w-24 truncate">
                  {user?.name}
                </span>
                <FaChevronDown className="w-4 h-4 text-stone-400" />
              </button>

              {userOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#232b1c] border border-[#e5d7c4]/20 dark:border-[#354024]/30 rounded-xl shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-[#e5d7c4]/20 dark:border-[#354024]/30">
                    <p className="font-medium text-[#354024] dark:text-[#e5d7c4] text-sm">{user?.name}</p>
                    <p className="text-xs text-stone-400 dark:text-[#cfbb99]">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs bg-[#54cd19]/20 dark:bg-[#54cd19]/10 text-[#354024] dark:text-[#54cd19] px-2 py-0.5 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard/settings"
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-stone-600 dark:text-[#cfbb99] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors">
                      <FaCog className="w-4 h-4" />
                      Pengaturan
                    </Link>
                    <Link
                      href="/dashboard/reports"
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-stone-600 dark:text-[#cfbb99] hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30 transition-colors"
                    >
                      <FaBook className="w-4 h-4" />
                      Laporan
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <FaSignOutAlt className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#f0f4e8] dark:bg-[#232b1c] border-t border-[#e5d7c4]/20 dark:border-[#354024]/30 z-30">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }} >
          {mobileNavItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const hasSubmenu = 'submenu' in item && Array.isArray(item.submenu) && item.submenu.length > 0;
            const isExpanded = expandedMenus.has(item.label);

            return (
              <div key={item.href} className="relative">
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex flex-col items-center justify-center py-2 px-1 transition-colors ${active
                      ? "text-[#54cd19] dark:text-[#889063]"
                      : "text-stone-500 dark:text-[#cfbb99] hover:text-[#354024] dark:hover:text-[#e5d7c4]"
                      }`}
                  >
                    {(() => {
                      const Icon = item.mobileIcon || item.icon;
                      return Icon ? <Icon className="w-5 h-5 mb-1" /> : null;
                    })()}
                    <span className="text-xs font-medium leading-tight text-center">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${active
                      ? "text-[#54cd19] dark:text-[#889063]"
                      : "text-stone-500 dark:text-[#cfbb99] hover:text-[#354024] dark:hover:text-[#e5d7c4]"
                      }`}
                  >
                    {(() => {
                      const Icon = item.mobileIcon || item.icon;
                      return Icon ? <Icon className="w-5 h-5 mb-1" /> : null;
                    })()}
                    <span className="text-xs font-medium leading-tight text-center">
                      {item.label.split(' ')[0]}
                    </span>
                  </Link>
                )}

                {hasSubmenu && isExpanded && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => toggleMenu(item.label)}/>
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-40">
                      <div className="flex gap-2">
                        {((item as any).submenu as NavItem[]).map((subItem: NavItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex-1 px-3 py-2 text-xs font-medium text-center rounded-lg transition-colors ${isActive(subItem.href)
                              ? "bg-[#54cd19] text-white"
                              : "bg-white dark:bg-[#232b1c] text-[#354024] dark:text-[#e5d7c4] border border-[#e5d7c4]/20 dark:border-[#354024]/30 hover:bg-[#e5d7c4]/20 dark:hover:bg-[#354024]/30"
                              }`}
                              >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}