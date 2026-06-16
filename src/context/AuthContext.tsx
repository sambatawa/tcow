import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PenggunaPublic } from "@/lib/pengguna";
import { apiPost } from "@/lib/api-client";
import { normalizeEmail } from "@/lib/validation";
import {
  firebaseSignOut,
  signInWithGooglePopup,
} from "@/lib/firebase-client";

interface AuthContextType {
  user: PenggunaPublic | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    no_kode: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    needsVerification?: boolean;
    email?: string;
  }>;
  verifyKode: (no_kode: string) => Promise<{ valid: boolean; error?: string }>;
  signInWithGoogle: (options?: {
    no_kode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: PenggunaPublic) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function persistUser(user: PenggunaPublic) {
  if (typeof window !== "undefined") {
    localStorage.setItem("sdf_user", JSON.stringify(user));
  }
}

export function normalizeStoredUser(raw: unknown): PenggunaPublic | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const uid = r.uid ?? r.id;
  const email = r.email;
  if (typeof uid !== "string" || typeof email !== "string") return null;

  const role =
    r.role === "Teknisi" || r.role === "Peternak" ? r.role : "Peternak";

  return {
    uid,
    firebase_uid:
      typeof r.firebase_uid === "string" ? r.firebase_uid : null,
    no_kode: typeof r.no_kode === "string" ? r.no_kode : "",
    name: typeof r.name === "string" ? r.name : "",
    email,
    role,
    image: typeof r.image === "string" ? r.image : null,
    alamat: typeof r.alamat === "string" ? r.alamat : null,
    createdAt:
      typeof r.createdAt === "string"
        ? r.createdAt
        : new Date().toISOString(),
    lastLogin:
      typeof r.lastLogin === "string"
        ? r.lastLogin
        : new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PenggunaPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sdf_user");
      if (stored) {
        try {
          const parsed = normalizeStoredUser(JSON.parse(stored));
          if (parsed) {
            setUser(parsed);
            persistUser(parsed);
          }
        } catch {
        }
      }
    }
    setIsLoading(false);
  }, []);

  const updateUser = useCallback((next: PenggunaPublic) => {
    setUser(next);
    persistUser(next);
  }, []);

  const verifyKode = async (
    no_kode: string
  ): Promise<{ valid: boolean; error?: string }> => {
    const result = await apiPost("/api/auth/verify-kode", { no_kode });
    if (result.ok) return { valid: true };
    return { valid: false, error: result.error ?? "No kode tidak valid" };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const result = await apiPost<PenggunaPublic>("/api/auth/login", {
      email: normalizeEmail(email),
      password,
    });

    if (!result.ok) {
      setIsLoading(false);
      return false;
    }

    setUser(result.data);
    persistUser(result.data);
    setIsLoading(false);
    return true;
  };

  const register = async (data: {
    no_kode: string;
    name: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    const result = await apiPost<{
      needsVerification?: boolean;
      email?: string;
    }>("/api/auth/register", {
      ...data,
      email: normalizeEmail(data.email),
    });

    setIsLoading(false);

    if (!result.ok) {
      return {
        success: false,
        error: result.error ?? "Gagal mengirim kode verifikasi",
      };
    }

    return {
      success: true,
      needsVerification: result.data.needsVerification,
      email: result.data.email,
    };
  };

  const signInWithGoogle = async (options?: { no_kode?: string }) => {
    setIsLoading(true);
    try {
      const idToken = await signInWithGooglePopup();
      const result = await apiPost<PenggunaPublic>("/api/auth/google", {
        idToken,...(options?.no_kode ? { no_kode: options.no_kode.trim() } : {}),
      });

      if (!result.ok) {
        return { success: false, error: result.error };
      }

      setUser(result.data);
      persistUser(result.data);
      return { success: true };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : "";
      if (code === "auth/popup-closed-by-user") {
        return { success: false, error: "popup-closed" };
      }
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal masuk dengan Google",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    void firebaseSignOut();
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sdf_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        verifyKode,
        signInWithGoogle,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
