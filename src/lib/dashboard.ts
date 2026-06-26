import type { riwayatreproduksi, sapi_status_hidup } from "@prisma/client";

export type DashboardAlert = {
  id: string;
  type: "danger" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type DashboardCattleRow = {
  idsapi: number;
  jenis_sapi: string;
  jenis_kelamin: string;
  status_hidup: sapi_status_hidup; 
  reproduksi: Pick<riwayatreproduksi, "tanggal_ib" | "nama_pejantan" | "keterangan"> | null;
  bb_akhir: number | null;
  periksaUpdate: string;
};

export type DashboardChartSapi = {
  key: string;
  label: string;
  color: string;
};

export type DashboardData = {
  stats: {
    totalSapi: number;
    healthy: number;
    sick: number;
    dead: number;
    totalFisik: number;
    avgWeight: number | null;
  };
  cattle: DashboardCattleRow[];
  produksiChart: Record<string, string | number>[];
  chartSapi: DashboardChartSapi[];
  alerts: DashboardAlert[];
};

const CHART_COLORS = [
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function healthToAlertType(
  status: sapi_status_hidup
): DashboardAlert["type"] {
  if (status === "Sakit") return "warning";
  if (status === "Mati") return "danger";
  return "success";
}

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}