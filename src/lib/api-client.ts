import { MSG } from "@/lib/validation";

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; data?: T };

export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? "Terjadi kesalahan",
        status: res.status,
        data,
      };
    }

    return { ok: true, data, status: res.status };
  } catch {
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
    body: JSON.stringify(body),
  });
}
