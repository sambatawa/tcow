type KesehatanTextInput = {
  estrus?: string | null;
  status_kesehatan?: string;
  reproduksi?: string;
  tanggal_estrus?: Date | null;
};

function estrusOrFallback(
  k: KesehatanTextInput,
  fallback: string
): string {
  return k.estrus?.trim() || fallback;
}

export function formatKesehatanAlertMessage(k: KesehatanTextInput): string {
  return estrusOrFallback(
    k,
    `Status reproduksi: ${k.reproduksi ?? "—"}${
      k.tanggal_estrus
        ? ` · Estrus: ${k.tanggal_estrus.toLocaleDateString("id-ID")}`
        : ""
    }`
  );
}

export function formatKesehatanMedicalDescription(k: KesehatanTextInput): string {
  return estrusOrFallback(
    k,
    `Status ${k.status_kesehatan ?? "—"}, reproduksi ${k.reproduksi ?? "—"}`
  );
}

export function formatKesehatanActivityDetail(k: KesehatanTextInput): string {
  return estrusOrFallback(
    k,
    `Pemeriksaan — ${k.status_kesehatan ?? "—"}, ${k.reproduksi ?? "—"}`
  );
}
