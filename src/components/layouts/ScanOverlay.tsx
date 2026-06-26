"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { toast } from "sonner";
import type { CattleListItem } from "@/lib/sapi";
import { Html5Qrcode } from "html5-qrcode";
import "@/app/globals.css";

interface ScanOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScanOverlay({ isOpen, onClose }: ScanOverlayProps) {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Mengaktifkan kamera...");
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [cattle, setCattle] = useState<CattleListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useNativeApi, setUseNativeApi] = useState(false);

  const stopScanner = useCallback(async () => {
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

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }
    setScannedCode(null);
    setCattle(null);
    setError(null);
    setCameraReady(false);
    setStatus("Mengaktifkan kamera...");
    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Perangkat tidak mendukung akses kamera.");
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
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          setScannedCode(decodedText);
          setScanning(false);
          fetchCattle(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      );

      setUseNativeApi(false);
      setCameraReady(true);
      setScanning(true);
      setStatus("Sedang memindai...");
    } catch (err: any) {
      if (hasNativeApi && !useNativeApi) {
        startNativeScanner();
        return;
      }
      if (err.name === "NotAllowedError") {
        setStatus("Izin ditolak");
        toast.error("Izinkan akses kamera terlebih dahulu");
      } else if (err.name === "NotFoundError") {
        setStatus("Kamera tidak ditemukan");
      } else {
        setStatus("Gagal mengakses kamera");
      }
    }
  };

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
      setScanning(true);
      setStatus("Sedang memindai...");

      const detector = new (window as any).BarcodeDetector({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a", "upc_e"],
      });
      nativeScanLoop(detector, videoElement, stream);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setStatus("Izin ditolak");
      } else {
        setStatus("Gagal mengakses kamera");
      }
    }
  };

  const nativeScanLoop = async (
    detector: any,
    videoElement: HTMLVideoElement,
    stream: MediaStream
  ) => {
    if (!scanning || !videoElement) return;

    try {
      const barcodes = await detector.detect(videoElement);
      if (barcodes.length > 0) {
        const value = barcodes[0]?.rawValue ?? barcodes[0]?.displayValue;
        if (value) {
          setScannedCode(value);
          setScanning(false);
          stream.getTracks().forEach(track => track.stop());
          await fetchCattle(value);
          return;
        }
      }
    } catch {}

    if (scanning) {
      setTimeout(() => nativeScanLoop(detector, videoElement, stream), 500);
    }
  };

  const fetchCattle = async (code: string) => {
    setError(null);
    setCattle(null);
    setStatus("Mencari data sapi...");

    try {
      const res = await fetch(`/api/sapi/${encodeURIComponent(code)}`);
      if (!res.ok) {
        toast.error("Sapi tidak ditemukan");
        setStatus("Sapi tidak ditemukan");
        return;
      }
      const json = await res.json();
      if (!json.cattle) {
        toast.error("Sapi tidak ditemukan");
        setStatus("Sapi tidak ditemukan");
        return;
      }

      setCattle(json.cattle);
      setStatus(`Sapi ditemukan: ${json.cattle.name}`);
      toast.success(`Sapi ${json.cattle.name} berhasil ditemukan!`);
    } catch {
      toast.error("Gagal mengambil data sapi");
      setStatus("Gagal mengambil data");
    }
  };

  const handleReset = async () => {
    setScannedCode(null);
    setCattle(null);
    setError(null);
    setStatus("Mempersiapkan scanner...");
    setScanning(false);
    await stopScanner();
    setTimeout(() => {
      startScanner();
    }, 100);
  };

  const handleViewDetail = () => {
    if (cattle?.id) {
      window.location.href = `/dashboard/cattle/${encodeURIComponent(cattle.id)}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-6 aspect-[4/3] bg-stone-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
        <div ref={videoRef} id="html5qr-video" className="w-full h-full">
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
            <div className="w-64 h-36 relative">
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
            <button onClick={handleReset} className="mt-4 px-5 py-2 bg-[#54cd19] hover:bg-[#3e9413] rounded-full text-xs font-medium transition">
              Coba Lagi
            </button>
          </div>
        )}
      </div>

      <button onClick={onClose} title="Close" className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors z-[110]">
        <FaX className="w-4 h-4" />
      </button>
      {cattle && (
        <div className="absolute bottom-10 inset-x-6 max-w-sm mx-auto bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-stone-900 dark:text-white truncate">{cattle.name}</p>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  cattle.health === "Sehat"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {cattle.health}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">{cattle.id} • {cattle.breed}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleReset} className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-white transition">
                Reset
              </button>
              <button onClick={handleViewDetail} className="px-3 py-1.5 bg-[#54cd19] text-white rounded-lg text-xs font-medium hover:bg-[#3e9413] transition">
                Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}