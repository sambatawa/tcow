import nodemailer from "nodemailer";
import { OTP_TTL_MS } from "@/lib/verification-policy";

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  };
}

export function isMailerConfigured(): boolean {
  return smtpConfig() !== null;
}

export const SMTP_NOT_CONFIGURED_MSG =
  "Layanan email belum dikonfigurasi. Isi SMTP_HOST, SMTP_USER, dan SMTP_PASS di file .env.";

const SMTP_SETUP_HINT =
  "Konfigurasi SMTP di file .env (lihat .env.example): SMTP_HOST, SMTP_USER, SMTP_PASS.";

export async function sendOtpEmail(
  to: string,
  code: string,
  name: string
): Promise<void> {
  const config = smtpConfig();
  const from =
    process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@adyatmakom.local";

  if (!config) {
    throw new Error(
      `Email verifikasi tidak dapat dikirim. ${SMTP_SETUP_HINT}`
    );
  }

  const ttlSeconds = Math.round(OTP_TTL_MS / 1000);
  const ttlLabel =
    OTP_TTL_MS < 120_000
      ? `${ttlSeconds} detik`
      : `${Math.max(1, Math.round(OTP_TTL_MS / 60000))} menit`;

  const transporter = nodemailer.createTransport(config);
  await transporter.sendMail({
    from,
    to,
    subject: "Kode verifikasi pendaftaran — AdyatmaKom",
    text: [
      `Halo ${name},`,
      "",
      `Kode verifikasi Anda: ${code}`,
      `Kode berlaku ${ttlLabel}. Jangan bagikan kepada siapa pun.`,
      "",
      "Jika Anda tidak mendaftar, abaikan email ini.",
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#354024">Verifikasi Email</h2>
        <p>Halo <strong>${escapeHtml(name)}</strong>,</p>
        <p>Masukkan kode berikut di halaman verifikasi:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#354024">${code}</p>
        <p style="color:#666;font-size:13px">Berlaku ${ttlLabel}. Jangan bagikan kode ini.</p>
      </div>
    `,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
