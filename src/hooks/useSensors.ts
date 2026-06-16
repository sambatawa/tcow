"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardAlert } from "@/lib/dashboard";
import type { SensorReading, TempHistoryPoint } from "@/lib/firebase-rtdb";

type SensorsPayload = {
  sensors: SensorReading[];
  tempHistory: TempHistoryPoint[];
  alerts: DashboardAlert[];
  cowNames: Record<string, string>;
  updatedAt: string;
  source?: string;
};

const empty: SensorsPayload = {
  sensors: [],
  tempHistory: [],
  alerts: [],
  cowNames: {},
  updatedAt: "",
};

export function useSensors(pollMs = 30000) {
  const [data, setData] = useState<SensorsPayload>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sensors");
      const json = (await res.json()) as SensorsPayload;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {load()}, 0);
    const intervalId = setInterval(load, pollMs);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [load, pollMs]);

  return { ...data, loading, error, refresh: load };
}
