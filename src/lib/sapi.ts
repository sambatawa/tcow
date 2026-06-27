export type CattleListItem = {
  id: string;
  idsapi: number;
  name: string;
  breed: string;
  gender: string;
  age: number;
  weight: number;
  status: string;
  health: string;
  stall: string;
  kandangKategori: string;
  birthDate: string;
  eartag: string | null;
  namaEartag: string | null;
  milkAvg: number;
  lastCheck: string;
};

export type LastVaccinationDates = {
  obatCacing: string | null;
  vaksinPmk: string | null;
  vaksinLsd: string | null;
};

export type PublicCattleScanInfo = Pick<
  CattleListItem,
  | "id"| "name"| "breed"| "gender"| "age"| "weight"| "health"| "stall"| "kandangKategori"| "birthDate"| "lastCheck"| "namaEartag"
> & {
  lastVaccinations: LastVaccinationDates;
};

export type CattleInput = {
  name: string;
  breed: string;
  gender?: "Jantan" | "Betina";
  kandang?: "Individu" | "KandangDara" | "KoloniBesar";
  birthDate?: string;
  health?: "Sehat" | "Sakit" | "Mati";
  weight?: number;
  lastCheck?: string;
  eartag?: string;
};

export type MedicalRecord = {
  id: string;
  cattleId: string;
  date: string;
  type: string;
  description: string;
  vet: string;
  status: string;
  jenisTindakan: string;
  catatan: string;
};

export type MedicalRecordInput = {
  jenisTindakan: "Obat_Cacing" | "Vaksin_PMK" | "Vaksin_LSD";
  date: string;
  catatan?: string;
  vet?: string;
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
  source: "medis" | "fisik" | "maintenance";
  sourceId: number;
  jenisTindakan?: string;
  beratBadan?: number;
};

export type ActivityInput = {
  kategori: "pemeriksaan" | "pencatatan_bobot" | "perawatan" | "vaksinasi";
  date: string;
  type?: string;
  detail?: string;
  petugas?: string;
  beratBadan?: number;
  jenisTindakan?: "Obat_Cacing" | "Vaksin_PMK" | "Vaksin_LSD";
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

export function formatKandangLabel(kandang: string): string {
  if (kandang === "KoloniBesar") return "Koloni Besar";
  if (kandang === "KandangDara") return "Kandang Dara";
  return kandang;
}
