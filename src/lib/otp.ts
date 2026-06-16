import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { OTP_TTL_MS } from "@/lib/verification-policy";

export type PendingRegisterPayload = {
  no_kode: string;
  name: string;
  email: string;
  passwordHash: string;
  alamat?: string;
};

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function serializePayload(data: PendingRegisterPayload): string {
  return JSON.stringify(data);
}

export function parsePayload(raw: string): PendingRegisterPayload | null {
  try {
    const p = JSON.parse(raw) as PendingRegisterPayload;
    if (!p.email || !p.passwordHash || !p.name || !p.no_kode) return null;
    return p;
  } catch {
    return null;
  }
}
