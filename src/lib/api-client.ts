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
    const res = await fetch(url, init);

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
