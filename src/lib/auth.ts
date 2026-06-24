import bcrypt from "bcryptjs";

export { validatePassword } from "@/lib/validation";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function verifyRegistrationKode(input: string): boolean {
  const expected = process.env.REGISTRATION_KODE?.trim();
  if (!expected) return false;
  return input.trim().toUpperCase() === expected.toUpperCase();
}
