"use client";

import { useState } from "react";
import { FaFileAlt, FaDownload, FaCalendarAlt, FaFilter, FaChartBar, FaChartPie } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("bulan");
  const [selectedReport, setSelectedReport] = useState("sapi");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    toast.info(`Mengekspor laporan ${selectedReport} dalam format ${format}...`);
    
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`Laporan ${selectedReport} berhasil diekspor`);
    }, 2000);
  };

  const reports = [
    {
      id: "sapi",
      name: "Laporan Sapi",
      icon: FaFileAlt,
      description: "Data lengkap sapi, kesehatan, dan aktivitas",
      lastGenerated: "2025-05-10 14:30",
      size: "2.4 MB"
    },
    {
      id: "kesehatan",
      name: "Laporan Kesehatan",
      icon: FaArrowUp,
      description: "Analisis kesehatan dan deteksi dini",
      lastGenerated: "2025-05-10 14:30",
      size: "1.8 MB"
    },
    {
      id: "maintenance",
      name: "Laporan Maintenance",
      icon: FaChartBar,
      description: "Jadwal dan riwayat maintenance perangkat",
      lastGenerated: "2025-05-10 14:30",
      size: "0.9 MB"
    },
    {
      id: "sistem",
      name: "Laporan Sistem",
      icon: FaChartPie,
      description: "Performa sistem dan penggunaan",
      lastGenerated: "2025-05-10 14:30",
      size: "1.2 MB"
    }
  ];

  const periods = [
    { value: "hari", label: "Hari Ini" },
    { value: "minggu", label: "Minggu Ini" },
    { value: "bulan", label: "Bulan Ini" },
    { value: "tahun", label: "Tahun Ini" }
  ];

  const stats = {
    totalSapi: 156,
    sapiSehat: 142,
    sapiButuhPerhatian: 14,
    maintenanceSelesai: 23,
    maintenanceTerjadwal: 3
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            Laporan & Analisis
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-2">
            Kelola, analisis, dan ekspor laporan sistem dan data ternak
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <FaFileAlt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.totalSapi}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Total Sapi</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <FaArrowUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.sapiSehat}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Sapi Sehat</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <FaChartBar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.maintenanceSelesai}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Maintenance Selesai</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <FaCalendarAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.maintenanceTerjadwal}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Maintenance Terjadwal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Laporan Tersedia
                </h2>
                <div className="flex items-center gap-2">
                  <FaFilter className="w-4 h-4 text-stone-400" />
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                  >
                    {periods.map((period) => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport === report.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                    }`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedReport === report.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                      }`}>
                        <report.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${
                          selectedReport === report.id
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}>
                          {report.name}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-stone-400">
                            Terakhir: {report.lastGenerated}
                          </span>
                          <span className="text-xs text-stone-400">
                            {report.size}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                <FaDownload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Ekspor Laporan
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Pilih format ekspor dan unduh laporan
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Format Ekspor
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["PDF", "Excel", "CSV"].map((format) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format.toLowerCase())}
                      disabled={isExporting}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        isExporting
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className={`w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isExporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengekspor...
                  </>
                ) : (
                  <>
                    <FaDownload className="w-4 h-4" />
                    Ekspor Laporan {reports.find(r => r.id === selectedReport)?.name}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
