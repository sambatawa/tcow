"use client";

import { useState } from "react";
import { FaShieldAlt, FaWifi, FaDatabase, FaBell, FaCog, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SystemConfigPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    // General Settings
    farmName: "Smart Dairy Farm Jawa Barat",
    timezone: "Asia/Jakarta",
    language: "id",
    autoBackup: true,
    
    // Network Settings
    wifiSSID: "CowManager_Network",
    wifiPassword: "••••••••••",
    networkStatus: "online",
    
    // Sensor Settings
    sensorUpdateInterval: 30, // seconds
    temperatureUnit: "celsius",
    alertThreshold: {
      high: 40.0,
      low: 35.0
    },
    
    // Data Settings
    dataRetention: 30, // days
    autoExport: false,
    exportFormat: "csv"
  });

  const [maintenance, setMaintenance] = useState({
    lastCheck: new Date().toLocaleString("id-ID"),
    nextMaintenance: "2025-06-15",
    status: "scheduled",
    devices: [
      { id: "DEV001", name: "Sensor Collar 1", status: "online", battery: 85 },
      { id: "DEV002", name: "Sensor Collar 2", status: "online", battery: 92 },
      { id: "DEV003", name: "Gateway Node", status: "online", battery: 100 },
      { id: "DEV004", name: "Sensor Collar 3", status: "offline", battery: 0 }
    ]
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: "warning", message: "Sensor Collar 3 battery low", time: "10 menit yang lalu", read: false },
    { id: 2, type: "info", message: "System backup completed", time: "1 jam yang lalu", read: false },
    { id: 3, type: "error", message: "Gateway Node connection lost", time: "2 jam yang lalu", read: true }
  ]);

  const handleSaveConfig = () => {
    toast.success("Konfigurasi sistem berhasil disimpan");
  };

  const handleTestConnection = () => {
    toast.info("Menguji koneksi jaringan...");
    setTimeout(() => {
      toast.success("Koneksi jaringan stabil");
    }, 2000);
  };

  const handleRestartDevice = (deviceId: string) => {
    toast.info(`Me-restart device ${deviceId}...`);
    setTimeout(() => {
      toast.success(`Device ${deviceId} berhasil di-restart`);
    }, 3000);
  };

  const handleExportData = () => {
    toast.success("Data berhasil diekspor");
  };

  const handleMarkAlertRead = (alertId: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            Konfigurasi Sistem
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-2">
            Kelola pengaturan sistem, jaringan, sensor, dan perangkat IoT
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Settings */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <FaCog className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Pengaturan Umum</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Konfigurasi dasar sistem</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Nama Farm
                </label>
                <input
                  type="text"
                  value={config.farmName}
                  onChange={(e) => setConfig({...config, farmName: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Timezone
                </label>
                <select
                  value={config.timezone}
                  onChange={(e) => setConfig({...config, timezone: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Auto Backup
                </label>
                <button
                  onClick={() => setConfig({...config, autoBackup: !config.autoBackup})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoBackup ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      config.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Simpan Pengaturan
            </button>
          </div>

          {/* Network Settings */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <FaWifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Pengaturan Jaringan</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Konfigurasi WiFi dan koneksi</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  WiFi SSID
                </label>
                <input
                  type="text"
                  value={config.wifiSSID}
                  onChange={(e) => setConfig({...config, wifiSSID: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={config.wifiPassword}
                  onChange={(e) => setConfig({...config, wifiPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Status</span>
                  <span className={`text-sm font-medium ${
                    config.networkStatus === 'online' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {config.networkStatus === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                <button
                  onClick={handleTestConnection}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Test Koneksi
                </button>
              </div>
            </div>
          </div>

          {/* Device Management */}
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <FaDatabase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Manajemen Perangkat</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Status sensor dan perangkat IoT</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {maintenance.devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border border-stone-200 dark:border-stone-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{device.name}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400">ID: {device.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      device.status === 'online' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                    <span className={`text-xs ${
                      device.battery > 50 ? 'text-emerald-600' : device.battery > 20 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {device.battery}%
                    </span>
                    <button
                      onClick={() => handleRestartDevice(device.id)}
                      className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 px-2 py-1 rounded transition-colors"
                    >
                      Restart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mt-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <FaBell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Notifikasi & Alert</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Kelola notifikasi sistem dan peringatan</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    alert.read 
                      ? 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50' 
                      : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                  }`}
                >
                  <div className="mt-1">
                    {alert.type === 'error' && <FaExclamationTriangle className="w-4 h-4 text-red-500" />}
                    {alert.type === 'warning' && <FaExclamationTriangle className="w-4 h-4 text-amber-500" />}
                    {alert.type === 'info' && <FaCheckCircle className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{alert.message}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{alert.time}</div>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={() => handleMarkAlertRead(alert.id)}
                      className="text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-700 dark:text-amber-300 px-2 py-1 rounded transition-colors"
                    >
                      Tandai Dibaca
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Export Section */}
        <div className="mt-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                <FaDatabase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Ekspor Data</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Ekspor data sistem dan laporan</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Format Ekspor
                </label>
                <select
                  value={config.exportFormat}
                  onChange={(e) => setConfig({...config, exportFormat: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Retensi Data (hari)
                </label>
                <input
                  type="number"
                  value={config.dataRetention}
                  onChange={(e) => setConfig({...config, dataRetention: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.autoExport}
                  onChange={(e) => setConfig({...config, autoExport: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-stone-300 rounded"
                />
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Ekspor Otomatis
                </label>
              </div>
              <button
                onClick={handleExportData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Ekspor Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
