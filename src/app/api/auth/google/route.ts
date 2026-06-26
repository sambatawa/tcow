import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRegistrationKode } from "@/lib/auth";
import { hashRandomPassword, isGoogleAuthServerConfigured, verifyFirebaseIdToken} from "@/lib/google-auth";
import { generateUid, serializePengguna } from "@/lib/pengguna";
import { generateToken, AUTH_COOKIE_OPTIONS } from "@/lib/jwt";

async function setAuthCookie(response: NextResponse, user: { uid: string; email: string; role: string }): Promise<NextResponse> {
  const token = await generateToken(user.uid, user.email, user.role);
  response.cookies.set({
    name: AUTH_COOKIE_OPTIONS.name,
    value: token,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    if (!isGoogleAuthServerConfigured()) {
      return NextResponse.json(
        { error: "Google Auth belum dikonfigurasi di server." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { idToken, no_kode } = body as {
      idToken: string;
      no_kode?: string;
    };

    if (!idToken?.trim()) {
      return NextResponse.json(
        { error: "Token Google tidak valid" },
        { status: 400 }
      );
    }

    const googleUser = await verifyFirebaseIdToken(idToken.trim());
    if (!googleUser) {
      return NextResponse.json(
        { error: "Token Google kedaluwarsa atau tidak valid" },
        { status: 401 }
      );
    }

    if (!googleUser.emailVerified) {
      return NextResponse.json(
        { error: "Email Google belum terverifikasi" },
        { status: 403 }
      );
    }

    const isRegister = Boolean(no_kode?.trim());

    if (isRegister) {
      if (!verifyRegistrationKode(no_kode!)) {
        return NextResponse.json(
          { error: "No kode farm tidak valid" },
          { status: 403 }
        );
      }

      const existingByFirebase = await prisma.pengguna.findUnique({
        where: { firebase_uid: googleUser.firebaseUid },
      });
      if (existingByFirebase) {
        return NextResponse.json(
          { error: "Akun Google ini sudah terdaftar" },
          { status: 409 }
        );
      }

      const existingByEmail = await prisma.pengguna.findUnique({
        where: { email: googleUser.email },
      });
      if (existingByEmail) {
        return NextResponse.json(
          { error: "Email sudah terdaftar. Gunakan masuk dengan Google atau email/password." },
          { status: 409 }
        );
      }

      const uid = await generateUid("Peternak");
      const passwordHash = await hashRandomPassword();

      const created = await prisma.pengguna.create({
        data: {
          uid,
          firebase_uid: googleUser.firebaseUid,
          no_kode: no_kode!.trim().toUpperCase(),
          name: googleUser.name,
          email: googleUser.email,
          password: passwordHash,
          role: "Peternak",
          image: googleUser.photoUrl,
          alamat: null,
        },
      });

      const response = NextResponse.json(serializePengguna(created));
      return setAuthCookie(response, created);
    }

    let pengguna = await prisma.pengguna.findUnique({
      where: { firebase_uid: googleUser.firebaseUid },
    });

    if (!pengguna) {
      pengguna = await prisma.pengguna.findUnique({
        where: { email: googleUser.email },
      });
    }

    if (!pengguna) {
      return NextResponse.json(
        { error: "Akun belum terdaftar. Daftar terlebih dahulu dengan no kode farm." },
        { status: 404 }
      );
    }

    const updated = await prisma.pengguna.update({
      where: { uid: pengguna.uid },
      data: {
        firebase_uid: googleUser.firebaseUid,
        lastLogin: new Date(),
        name: pengguna.name || googleUser.name,
        image: googleUser.photoUrl ?? pengguna.image,
      },
    });

    const response = NextResponse.json(serializePengguna(updated));
    return setAuthCookie(response, updated);
  } catch {
    return NextResponse.json(
      { error: "Gagal masuk dengan Google" },
      { status: 500 }
    );
  }
}
