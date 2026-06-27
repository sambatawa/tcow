import { MSG } from "@/lib/validation";

export type ApiResult<T> = | { ok: true; data: T; status: number } | { ok: false; error: string; status: number; data?: T };

function handleUnauthorized() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    localStorage.removeItem("sdf_user");
    window.location.href = "/login";
  }
}

export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const headers = new Headers(init?.headers);
    
    // Add auth headers from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sdf_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.uid) headers.set("x-user-id", user.uid);
          if (user?.email) headers.set("x-user-email", user.email);
          if (user?.role) headers.set("x-user-role", user.role);
        } catch {
          // Ignore parse errors
        }
      }
    }

    const res = await fetch(url, {
      ...init,
      headers,
    });

    const data = (await res.json().catch(() => ({}))) as T & { error?: string };

    if (res.status === 401) {
      handleUnauthorized();
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? "Terjadi kesalahan",
        status: res.status,
        data,
      };
    }

    return { ok: true, data, status: res.status };
  } catch (e) {
    return { ok: false, error: MSG.networkError, status: 0 };
  }
}

export async function apiPost<T = Record<string, unknown>>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify(body),
  });
}

export async function apiGet<T = Record<string, unknown>>(
  url: string
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, {
    method: "GET",
    credentials: "include",
  });
}
