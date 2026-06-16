import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth";

export type VerifiedGoogleUser = {
  firebaseUid: string;
  email: string;
  name: string;
  photoUrl: string | null;
  emailVerified: boolean;
};

function getFirebaseApiKey(): string | null {
  return (
    process.env.FIREBASE_APIKEY?.trim() || null
  );
}

export function isGoogleAuthServerConfigured(): boolean {
  return getFirebaseApiKey() !== null;
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedGoogleUser | null> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    users?: Array<{
      localId: string;
      email?: string;
      displayName?: string;
      photoUrl?: string;
      emailVerified?: boolean | string;
    }>;
  };

  const user = data.users?.[0];
  if (!user?.localId || !user.email) return null;

  const emailVerified =
    user.emailVerified === true || user.emailVerified === "true";

  return {
    firebaseUid: user.localId,
    email: user.email.trim().toLowerCase(),
    name: user.displayName?.trim() || user.email.split("@")[0],
    photoUrl: user.photoUrl?.trim() || null,
    emailVerified,
  };
}
export async function hashRandomPassword(): Promise<string> {
  return hashPassword(randomBytes(32).toString("hex"));
}
