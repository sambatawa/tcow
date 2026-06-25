import { SignJWT, jwtVerify, type JWTPayload } from "jose";
export type TokenPayload = JWTPayload & {
  uid: string;
  email: string;
  role: string;
};

export type AuthUser = {
  uid: string;
  email: string;
  role: string;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function generateToken(
  uid: string,
  email: string,
  role: string,
  expiresIn: number = 24 * 60 * 60
): Promise<string> {
  const secret = getSecretKey();

  const token = await new SignJWT({ uid, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    const typedPayload = payload as TokenPayload;

    if (!typedPayload.uid || !typedPayload.email || !typedPayload.role) {
      return null;
    }

    return {
      uid: typedPayload.uid,
      email: typedPayload.email,
      role: typedPayload.role,
    };
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_OPTIONS: {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
} = {
  name: "auth_token",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60,
};

export function parseAuthToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === AUTH_COOKIE_OPTIONS.name) {
      return value;
    }
  }
  return null;
}
