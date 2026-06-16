export type CattleListItem = {
  id: string;
  idsapi: number;
  name: string;
  breed: string;
  age: number;
  weight: number;
  status: string;
  health: string;
  stall: string;
  kandangKategori: string;
  birthDate: string;
  milkAvg: number;
  lastCheck: string;
};

export type MedicalRecord = {
  id: string;
  cattleId: string;
  date: string;
  type: string;
  description: string;
  vet: string;
  status: string;
};

export type VaccinationRecord = {
  id: string;
  cattleId: string;
  vaccine: string;
  date: string;
  nextDue: string;
  status: string;
  vet: string;
  batch: string;
};

export type CattleActivity = {
  id: string;
  cattleId: string;
  date: string;
  type: string;
  detail: string;
  petugas: string;
  kategori: string;
};

export type SapiBundle = {
  cattle: CattleListItem[];
  medicalHistory: MedicalRecord[];
  vaccinationData: VaccinationRecord[];
  cattleActivityLog: CattleActivity[];
};

export function idsapiToCattleId(idsapi: number): string {
  return `S${String(idsapi).padStart(3, "0")}`;
}

export function parseCattleId(id: string): number | null {
  const m = /^S?0*(\d+)$/i.exec(id.trim());
  return m ? parseInt(m[1], 10) : null;
}

export function calcAgeYears(birth: Date): number {
  const diff = Date.now() - birth.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

export function reproduksiLabel(r: string): string {
  if (r === "Kosong") return "Dara";
  return r;
}

export function mapKesehatanType(status: string): string {
  if (status === "Sakit") return "Pengobatan";
  if (status === "Perhatian") return "Pemeriksaan";
  return "Pemeriksaan Rutin";
}
