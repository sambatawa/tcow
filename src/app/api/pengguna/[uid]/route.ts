import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { initPengguna } from "@/lib/pengguna";

type RouteParams = { params: Promise<{ uid: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { uid } = await params;

  try {
    const pengguna = await prisma.pengguna.findUnique({
      where: { uid },
    });

    if (!pengguna) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(initPengguna(pengguna));
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { uid } = await params;

  try {
    const body = await request.json();
    const { name, alamat, image, email } = body as {
      name?: string;
      alamat?: string;
      image?: string;
      email?: string;
    };

    if (!name?.trim() && alamat === undefined && image === undefined) {
      return NextResponse.json(
        { error: "Tidak ada data yang diperbarui" },
        { status: 400 }
      );
    }

    let existing = await prisma.pengguna.findUnique({ where: { uid } });
    if (!existing && email) {
      existing = await prisma.pengguna.findUnique({ where: { email } });
    }
    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan di database" },
        { status: 404 }
      );
    }

    const pengguna = await prisma.pengguna.update({
      where: { uid: existing.uid },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(alamat !== undefined && { alamat: alamat.trim() }),
        ...(image !== undefined && { image: image.trim() }),
        lastLogin: new Date(),
      },
    });

    return NextResponse.json(initPengguna(pengguna));
  } catch (error) {
    console.error("[PATCH /api/pengguna]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
