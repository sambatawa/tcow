"use client";

import { useEffect, useState } from "react";
import type { SapiBundle } from "@/lib/sapi";

const empty: SapiBundle = {
  cattle: [],
  medicalHistory: [],
  vaccinationData: [],
  cattleActivityLog: [],
};

export function useSapiBundle() {
  const [data, setData] = useState<SapiBundle>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sapi");
        if (!res.ok) throw new Error("Gagal memuat data sapi");
        const json = (await res.json()) as SapiBundle;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading, error };
}
