"use client";

import { useEffect, useRef, useState } from "react";
import { FaCamera, FaQrcode, FaStop, FaExclamationTriangle } from "react-icons/fa";
import type { CattleListItem } from "@/lib/sapi";

export default function ScanCameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Siapkan kamera untuk scan kode batang.");
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [cattle, setCattle] = useState<CattleListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupported("BarcodeDetector" in window);
    }

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopScan = () => {
    setScanning(false);
    setStatus("Scan dihentikan. Tekan tombol Scan untuk memulai ulang.");
    stopCamera();
  };

  const fetchCattle = async (code: string) => {
    setError(null);
    setCattle(null);
    setStatus("Mencari informasi sapi...");

    try {
      const res = await fetch(`/api/sapi/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error("Sapi tidak ditemukan untuk kode ini.");
      }

      const json = await res.json();
      if (!json.cattle) {
        throw new Error("Sapi tidak ditemukan.");
      }

      setCattle(json.cattle);
      setStatus("Informasi sapi berhasil ditemukan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data sapi.");
      setStatus("Coba scan ulang atau gunakan kode batang lain.");
    }
  };

  const scanLoop = async (detector: any) => {
    if (!videoRef.current || !scanning) return;

    try {
      const barcodes = await detector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const value = barcodes[0]?.rawValue ?? barcodes[0]?.displayValue;
        if (value) {
          setScannedCode(value);
          setStatus(`Kode terdeteksi: ${value}`);
          setScanning(false);
          stopCamera();
          await fetchCattle(value);
          return;
        }
      }
    } catch (err) {
      console.error(err);
      setError("Gagal membaca kode. Silakan coba lagi.");
    }

    setTimeout(() => scanLoop(detector), 600);
  };

  const startScan = async () => {
    setError(null);
    setCattle(null);
    setScannedCode(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Perangkat tidak mendukung akses kamera.");
      return;
    }

    if (!supported) {
      setError("Browser Anda belum mendukung pemindaian barcode. Gunakan Chrome/Edge terbaru.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new (window as any).BarcodeDetector({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a", "upc_e"],
      });

      setScanning(true);
      setStatus("Sedang memindai... Arahkan kamera ke barcode sapi.");
      scanLoop(detector);
    } catch (err) {
      console.error(err);
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      setStatus("Tekan Scan untuk mencoba kembali.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950">
        <div className="flex items-center gap-3">
          <div className="rounded-3xl bg-[#54cd19] p-3 text-white shadow-sm">
            <FaCamera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Scan Kamera</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Pindai barcode sapi untuk membuka halaman informasi foto dan detail sapi.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="relative overflow-hidden rounded-3xl bg-black/5">
              <video ref={videoRef} className="h-72 w-full object-cover" muted playsInline />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white">
                  <FaQrcode className="mb-3 h-10 w-10" />
                  <p className="text-sm">Tekan Scan untuk memulai kamera</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200">
              <p className="font-semibold">Status Pemindaian</p>
              <p className="mt-2 text-sm leading-relaxed">{status}</p>
              {error && (
                <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  <FaExclamationTriangle className="inline mr-2" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={scanning ? stopScan : startScan}
                className={`inline-flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold text-white transition ${scanning ? "bg-red-600 hover:bg-red-700" : "bg-[#54cd19] hover:bg-[#47b117]"}`}
              >
                {scanning ? <FaStop className="h-4 w-4" /> : <FaCamera className="h-4 w-4" />} 
                {scanning ? "Hentikan Scan" : "Mulai Scan"}
              </button>

              {scannedCode && (
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">Hasil Scan</p>
                  <p className="mt-2 font-semibold text-stone-900 dark:text-stone-100">{scannedCode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {cattle ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Informasi Sapi</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Detail sapi yang dipindai dari barcode.</p>
            </div>
            <span className="rounded-full bg-[#e7f6d7] px-3 py-1 text-xs font-semibold text-[#2f6d0f] dark:bg-[#214d0e]/30 dark:text-[#d0f5a5]">
              {cattle.health}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">ID Sapi</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.id}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Nama</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.name}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Breed</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.breed}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Kandang</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.stall}</p>
              </div>
            </div>
            <div className="space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Status</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.status}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Umur</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.age} tahun</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Berat</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Terakhir diperiksa</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{cattle.lastCheck}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
