"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardAlert } from "@/lib/dashboard";
import type { HealthAlert } from "@/lib/firebase-rtdb";

const emptyAlerts: HealthAlert[] = [];

export function useNotifications(pollMs = 30000) {
  const [alerts, setAlerts] = useState<HealthAlert[]>(emptyAlerts);
  const [dashboardAlerts, setDashboardAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sensors", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Gagal mengambil data notifikasi");
      }

      const json = await res.json();

      // Convert sensor alerts to HealthAlert format
      if (json.alerts && Array.isArray(json.alerts)) {
        const healthAlerts: HealthAlert[] = json.alerts.map((alert: DashboardAlert & { cattleId?: string; cattleName?: string; eartag?: string; temperature?: number; healthStatus?: string }) => ({
          id: alert.id,
          type: alert.type === "danger" ? "danger" : "warning",
          title: alert.title,
          message: alert.message,
          time: alert.time,
          read: alert.read ?? false,
          cattleId: alert.cattleId ?? "",
          cattleName: alert.cattleName ?? alert.title.replace("Sensor ", ""),
          eartag: alert.eartag ?? "",
          temperature: alert.temperature ?? 0,
          healthStatus: alert.healthStatus ?? "unknown",
        }));

        setAlerts(healthAlerts);
        setDashboardAlerts(json.alerts);
        setLastFetch(new Date());
      }

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => { load(); }, 0);
    const intervalId = setInterval(load, pollMs);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [load, pollMs]);

  return { alerts, dashboardAlerts, loading, error, lastFetch, refresh: load };
}
