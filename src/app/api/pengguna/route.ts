import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  roleToPrisma,
  serializePengguna,
  type AppRole,
} from "@/lib/pengguna";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  try {
    if (!email) {
      const list = await prisma.pengguna.findMany({
        orderBy: { createdAt: "desc" },
      });
      const usersData = list.map((p) => {
        const daysSinceLogin = Math.floor(
          (Date.now() - p.lastLogin.getTime()) / (24 * 60 * 60 * 1000)
        );
        return {
          id: p.uid,
          name: p.name,
          email: p.email,
          role: p.role,
          farm: "Adyatma Farm",
          status: daysSinceLogin <= 30 ? "Aktif" : "Nonaktif",
          lastLogin: p.lastLogin.toLocaleString("id-ID"),
          joinDate: p.createdAt.toISOString().split("T")[0],
        };
      });
      return NextResponse.json({ usersData });
    }

    const pengguna = await prisma.pengguna.findUnique({
      where: { email },
    });

    if (!pengguna) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializePengguna(pengguna));
  } catch (error) {
    console.error("[GET /api/pengguna]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

/** Buat atau sinkronkan akun demo ke tabel pengguna. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      uid,
      firebase_uid,
      name,
      email,
      role,
      image = "",
      alamat = "",
    } = body as {
      uid: string;
      firebase_uid: string;
      name: string;
      email: string;
      role: AppRole;
      image?: string;
      alamat?: string;
    };

    if (!uid || !email || !name || !role) {
      return NextResponse.json(
        { error: "uid, name, email, dan role wajib diisi" },
        { status: 400 }
      );
    }

    const { hashPassword } = await import("@/lib/auth");
    const placeholderPassword = await hashPassword(
      `legacy-${uid}-${Date.now()}`
    );

    const pengguna = await prisma.pengguna.upsert({
      where: { email },
      create: {
        uid,
        no_kode: process.env.REGISTRATION_KODE ?? "LEGACY",
        firebase_uid: firebase_uid || `legacy-${uid}`,
        name,
        email,
        password: placeholderPassword,
        role: roleToPrisma(role),
        image,
        alamat,
      },
      update: {
        name,
        image,
        alamat,
        lastLogin: new Date(),
      },
    });

    return NextResponse.json(serializePengguna(pengguna));
  } catch (error) {
    console.error("[POST /api/pengguna]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengguna" },
      { status: 500 }
    );
  }
}
