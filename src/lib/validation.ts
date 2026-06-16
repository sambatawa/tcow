export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MSG = {
  emailRequired: "Email wajib diisi.",
  emailInvalid: "Format email tidak valid.",
  passwordRequired: "Password wajib diisi.",
  passwordInvalid:
    "Password harus memuat huruf besar, huruf kecil, angka, dan karakter khusus (min. 5 karakter).",
  passwordMismatch: "Konfirmasi password tidak cocok.",
  networkError: "Gagal menghubungi server",
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export type PasswordCheck = { label: string; valid: boolean };

const PASSWORD_RULES: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: "Minimal 5 karakter", test: (p) => p.length >= 5 },
  { label: "Satu huruf kecil", test: (p) => /[a-z]/.test(p) },
  { label: "Satu huruf besar", test: (p) => /[A-Z]/.test(p) },
  { label: "Satu angka", test: (p) => /\d/.test(p) },
  { label: "Satu karakter khusus", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function getPasswordChecks(password: string): PasswordCheck[] {
  return PASSWORD_RULES.map(({ label, test }) => ({
    label,
    valid: test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return getPasswordChecks(password).every((c) => c.valid);
}

export function validatePassword(password: string): string | null {
  if (!password) return MSG.passwordRequired;
  const checks = getPasswordChecks(password);
  const failed = checks.find((c) => !c.valid);
  if (!failed) return null;

  if (failed.label === "Minimal 5 karakter") return "Password minimal 5 karakter.";
  if (failed.label === "Satu huruf kecil") return "Password harus mengandung huruf kecil.";
  if (failed.label === "Satu huruf besar") return "Password harus mengandung huruf besar.";
  if (failed.label === "Satu angka") return "Password harus mengandung angka.";
  return "Password harus mengandung karakter khusus.";
}
