import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { serializePengguna } from "@/lib/pengguna";
import { normalizeEmail } from "@/lib/validation";
import { loginRateLimiter } from "@/lib/ratelimit";
import { generateToken, AUTH_COOKIE_OPTIONS } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await loginRateLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Akses dikunci sementara, silakan coba beberapa menit lagi." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const pengguna = await prisma.pengguna.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pengguna) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, pengguna.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const updated = await prisma.pengguna.update({
      where: { uid: pengguna.uid },
      data: { lastLogin: new Date() },
    });

    const token = await generateToken(
      pengguna.uid,
      pengguna.email,
      pengguna.role
    );

    const userData = serializePengguna(updated);
    const response = NextResponse.json(userData, { status: 200 });

    // Set cookie with proper settings
    const cookieOptions = {
      name: AUTH_COOKIE_OPTIONS.name,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    };

    response.cookies.set(cookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Gagal masuk" },
      { status: 500 }
    );
  }
}