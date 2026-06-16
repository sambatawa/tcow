import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRegistrationKode } from "@/lib/auth";
import {
  hashRandomPassword,
  isGoogleAuthServerConfigured,
  verifyFirebaseIdToken,
} from "@/lib/google-auth";
import { generateUid, serializePengguna } from "@/lib/pengguna";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    if (!isGoogleAuthServerConfigured()) {
      return jsonError("Google Auth belum dikonfigurasi di server.", 503);
    }

    const body = await request.json();
    const { idToken, no_kode } = body as {
      idToken: string;
      no_kode?: string;
    };

    if (!idToken?.trim()) {
      return jsonError("Token Google tidak valid", 400);
    }

    const googleUser = await verifyFirebaseIdToken(idToken.trim());
    if (!googleUser) {
      return jsonError("Token Google kedaluwarsa atau tidak valid", 401);
    }

    if (!googleUser.emailVerified) {
      return jsonError("Email Google belum terverifikasi", 403);
    }

    const isRegister = Boolean(no_kode?.trim());

    if (isRegister) {
      if (!verifyRegistrationKode(no_kode!)) {
        return jsonError("No kode farm tidak valid", 403);
      }

      const existingByFirebase = await prisma.pengguna.findUnique({
        where: { firebase_uid: googleUser.firebaseUid },
      });
      if (existingByFirebase) {
        return jsonError("Akun Google ini sudah terdaftar", 409);
      }

      const existingByEmail = await prisma.pengguna.findUnique({
        where: { email: googleUser.email },
      });
      if (existingByEmail) {
        return jsonError(
          "Email sudah terdaftar. Gunakan masuk dengan Google atau email/password.",
          409
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

      return jsonOk(serializePengguna(created) as Record<string, unknown>);
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
      return jsonError(
        "Akun belum terdaftar. Daftar terlebih dahulu dengan no kode farm.",
        404
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

    return jsonOk(serializePengguna(updated) as Record<string, unknown>);
  } catch (error) {
    console.error("[POST /api/auth/google]", error);
    return jsonError("Gagal masuk dengan Google", 500);
  }
}
