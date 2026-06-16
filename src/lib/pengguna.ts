import type { pengguna } from "@prisma/client";

export type AppRole = "Peternak" | "Teknisi";

export type PenggunaPublic = {
  uid: string;
  firebase_uid: string | null;
  no_kode: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
  alamat: string | null;
  createdAt: string;
  lastLogin: string;
};

export function roleToPrisma(role: AppRole): Role {
  return role;
}

export function serializePengguna(pengguna: Pengguna): PenggunaPublic {
  return {
    uid: pengguna.uid,
    firebase_uid: pengguna.firebase_uid,
    no_kode: pengguna.no_kode,
    name: pengguna.name,
    email: pengguna.email,
    role: pengguna.role,
    image: pengguna.image,
    alamat: pengguna.alamat,
    createdAt: pengguna.createdAt.toISOString(),
    lastLogin: pengguna.lastLogin.toISOString(),
  };
}

export function initPengguna(pengguna: Pengguna): PenggunaPublic {
  return serializePengguna(pengguna);
}

export async function generateUid(role: Role): Promise<string> {
  const { default: prisma } = await import("@/lib/prisma");
  const prefix = role === "Teknisi" ? "TKN" : "PTR";
  const count = await prisma.pengguna.count({ where: { role } });
  const num = String(count + 1).padStart(3, "0");
  return `${prefix}${num}`;
}
