export type AppRole = "Peternak" | "Teknisi";
export type Role = "Peternak" | "Teknisi";

export type Pengguna = {
  uid: string;
  firebase_uid: string | null;
  no_kode: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
  alamat: string | null;
  createdAt: Date;
  lastLogin: Date;
};

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
  
  // Use timestamp + random to ensure uniqueness (max 10 chars for VarChar(10))
  const timestamp = Date.now().toString().slice(-5); // Last 5 digits of timestamp
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const uid = `${prefix}${timestamp}${random}`; // 3 + 5 + 2 = 10 chars
  
  // Verify it doesn't exist
  const existing = await prisma.pengguna.findUnique({
    where: { uid },
  });
  
  if (existing) {
    // If by some chance it exists, try again with different random
    const random2 = Math.floor(Math.random() * 100).toString().padStart(2, "0");
    return `${prefix}${timestamp}${random2}`;
  }
  
  return uid;
}