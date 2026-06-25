import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { roleToPrisma, serializePengguna, type AppRole} from "@/lib/pengguna";
import { getAuthUser, requireRole } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
          uid: p.uid,
          name: p.name,
          email: p.email,
          role: p.role,
          farm: "Adyatma Farm",
          status: daysSinceLogin <= 30 ? "Aktif" : "Nonaktif",
          lastLogin: p.lastLogin.toLocaleString("id-ID"),
          createdAt: p.createdAt.toISOString(),
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

export async function POST(request: NextRequest) {
  const user = requireRole(request, ["Teknisi"]);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await request.json();
    const { uid, firebase_uid, name, email, role, image = "", alamat = ""} = body as {
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

export async function PUT(request: NextRequest) {
  const user = requireRole(request, ["Teknisi"]);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await request.json();
    const { uid, name, email, role, alamat } = body as {
      uid: string;
      name?: string;
      email?: string;
      role?: AppRole;
      alamat?: string;
    };

    if (!uid) {
      return NextResponse.json(
        { error: "UID wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.pengguna.findUnique({ where: { uid } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const pengguna = await prisma.pengguna.update({
      where: { uid },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(role !== undefined && { role: roleToPrisma(role) }),
        ...(alamat !== undefined && { alamat: alamat.trim() }),
        lastLogin: new Date(),
      },
    });

    return NextResponse.json(serializePengguna(pengguna));
  } catch (error) {
    console.error("[PUT /api/pengguna]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengguna" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = requireRole(request, ["Teknisi"]);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "UID wajib diisi" },
        { status: 400 }
      );
    }

    if (user.uid === uid) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun sendiri" },
        { status: 400 }
      );
    }

    const existing = await prisma.pengguna.findUnique({ where: { uid } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.pengguna.delete({ where: { uid } });

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/pengguna]", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
