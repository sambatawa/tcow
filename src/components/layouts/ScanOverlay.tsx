"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { swalWarning } from "@/lib/swal";
import type { PublicCattleScanInfo } from "@/lib/sapi";
import { formatKandangLabel } from "@/lib/sapi";
import { Html5Qrcode } from "html5-qrcode";
import "@/app/globals.css";

interface ScanOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScanOverlay({ isOpen, onClose }: ScanOverlayProps) {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const processingRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Mengaktifkan kamera...");
  const [cattle, setCattle] = useState<PublicCattleScanInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useNativeApi, setUseNativeApi] = useState(false);

  const stopScanner = useCallback(async () => {
    scanningRef.current = false;
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraReady(false);
  }, []);

  const startScanner = async () => {
    setError(null);
    processingRef.current = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Perangkat tidak bisa akses kamera.");
      setStatus("Kamera tidak tersedia");
      return;
    }

    const hasNativeApi = "BarcodeDetector" in window;
    try {
      const scannerId = "html5qr-video";
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 320, height: 260 }, 
          aspectRatio: 1.0, 
        },
        (decodedText) => {
          handleScanResult(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      );

      setUseNativeApi(false);
      setCameraReady(true);
      scanningRef.current = true;
      setScanning(true);
      setStatus("Arahkan kamera ke barcode");
    } catch (err: unknown) {
      if (hasNativeApi && !useNativeApi) {
        startNativeScanner();
        return;
      }
      const error = err as { name?: string };
      if (error.name === "NotAllowedError") {
        setStatus("Izin ditolak");
        swalWarning("Izin Ditolak", "Izinkan akses kamera");
      } else if (error.name === "NotFoundError") {
        setStatus("Kamera tidak ditemukan");
      } else {
        setStatus("Gagal mengakses kamera");
      }
    }
  };

  const resumeScanning = useCallback(async () => {
    processingRef.current = false;
    setCattle(null);
    setStatus("Mempersiapkan scanner...");
    await stopScanner();
    setTimeout(() => {
      startScanner();
    }, 300);
  }, [stopScanner]);

  const handleScanResult = useCallback(
    async (decodedText: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      scanningRef.current = false;
      setScanning(false);
      const code = decodedText.trim();
      if (!code) {
        processingRef.current = false;
        return;
      }

      setStatus("Mencari data sapi...");

      try {
        const res = await fetch(
          `/api/sapi/scan/${encodeURIComponent(code)}`
        );

        if (!res.ok) {
          setStatus("Barcode bukan eartag TCow — lanjut memindai...");
          processingRef.current = false;
          setTimeout(() => {
            resumeScanning();
          }, 1800);
          return;
        }

        const json = (await res.json()) as { cattle?: PublicCattleScanInfo };
        if (!json.cattle) {
          setStatus("Barcode bukan eartag TCow skip");
          processingRef.current = false;
          setTimeout(() => {
            resumeScanning();
          }, 1800);
          return;
        }

        await stopScanner();
        setCattle(json.cattle);
        setStatus(`Sapi ditemukan: ${json.cattle.name}`);
      } catch {
        setStatus("Gagal mengambil data coba lagi...");
        processingRef.current = false;
        setTimeout(() => {
          resumeScanning();
        }, 1800);
      }
    },
    [resumeScanning, stopScanner]
  );

  const startNativeScanner = async () => {
    const videoElement = videoRef.current?.querySelector("video");
    if (!videoElement) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoElement.srcObject = stream;
      await videoElement.play();
      setUseNativeApi(true);
      setCameraReady(true);
      scanningRef.current = true;
      setScanning(true);
      setStatus("Arahkan kamera ke barcode eartag...");

      const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string; displayValue?: string }>> } }).BarcodeDetector({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a", "upc_e"],
      });
      nativeScanLoop(detector, videoElement, stream);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === "NotAllowedError") {
      } else {
        setStatus("Gagal mengakses kamera");
      }
    }
  };

  const nativeScanLoop = async (
    detector: { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string; displayValue?: string }>> },
    videoElement: HTMLVideoElement,
    stream: MediaStream
  ) => {
    if (!scanningRef.current || !videoElement) return;

    try {
      const barcodes = await detector.detect(videoElement);
      if (barcodes.length > 0) {
        const value = barcodes[0]?.rawValue ?? barcodes[0]?.displayValue;
        if (value) {
          stream.getTracks().forEach((track) => track.stop());
          await handleScanResult(value);
          return;
        }
      }
    } catch {
    }

    if (scanningRef.current) {
      setTimeout(() => nativeScanLoop(detector, videoElement, stream), 500);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }
    setCattle(null);
    setError(null);
    setCameraReady(false);
    setStatus("Mengaktifkan kamera...");
    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const handleReset = async () => {
    await resumeScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {!cattle && (
        <div className="relative w-full max-w-xl mx-4 h-[70vh] md:h-[60vh] bg-stone-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
          <div ref={videoRef} id="html5qr-video" className="w-full h-full [&>video]:object-cover">
            {useNativeApi && (
              <video className="w-full h-full object-cover" playsInline muted />
            )}
          </div>

          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-10">
            <div className="bg-black/60 backdrop-blur-md px-5 py-1.5 rounded-full border border-white/10">
              <p className="text-white text-xs font-medium tracking-wide">
                {status}
              </p>
            </div>
          </div>

          {scanning && cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-64 relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-[#4ade80] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-[#4ade80] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-[#4ade80] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-[#4ade80] rounded-br-lg" />
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 z-20">
              <FaExclamationTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="text-center text-sm">{error}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-5 py-2 bg-[#54cd19] hover:bg-[#3e9413] rounded-full text-xs font-medium transition"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onClose}
        title="Close"
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors z-[110]"
      >
        <FaX className="w-4 h-4" />
      </button>

      {cattle && (
        <div className="w-full max-w-md mx-6 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 z-30 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
          <div className="bg-brand-forest dark:bg-brand-accent/90 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white dark:text-brand-forest font-semibold text-base truncate">
                {cattle.name}
              </p>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                cattle.health === "Sehat"
                  ? "bg-green-400/20 text-green-100"
                  : cattle.health === "Sakit"
                    ? "bg-red-400/20 text-red-100"
                    : "bg-stone-400/20 text-stone-200"
              }`}
            >
              {cattle.health}
            </span>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Jenis</p>
              <p className="font-medium text-stone-800 dark:text-stone-100 truncate">{cattle.breed}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Kelamin</p>
              <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.gender}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Umur</p>
              <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.age} tahun</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Bobot</p>
              <p className="font-medium text-stone-800 dark:text-stone-100">
                {cattle.weight > 0 ? `${cattle.weight} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Kandang</p>
              <p className="font-medium text-stone-800 dark:text-stone-100 truncate">
                {formatKandangLabel(cattle.kandangKategori)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Pemeriksaan</p>
              <p className="font-medium text-stone-800 dark:text-stone-100">{cattle.lastCheck}</p>
            </div>
          </div>

          <div className="px-4 pb-3 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-2">
              Vaksinasi Terakhir
            </p>
            <div className="space-y-2">
              {(
                [
                  { label: "Obat Cacing", date: cattle.lastVaccinations.obatCacing },
                  { label: "Vaksin PMK", date: cattle.lastVaccinations.vaksinPmk },
                  { label: "Vaksin LSD", date: cattle.lastVaccinations.vaksinLsd },
                ] as const
              ).map((item) => (
                <div key={item.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-stone-500 dark:text-stone-400">{item.label}</span>
                  <span className="font-medium text-stone-800 dark:text-stone-100 shrink-0">
                    {item.date ?? "Belum pernah"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[#54cd19] hover:bg-[#3e9413] text-white rounded-xl text-xs font-semibold transition"
            >
              Scan Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}