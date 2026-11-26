"use client";

/** JSON envelope shapes some routes return instead of a bare array. */
interface ErrorBody {
  error?: string;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as ErrorBody;
  if (!res.ok) throw new Error(data.error || `POST ${path} failed: ${res.status}`);
  return data as T;
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ErrorBody;
  if (!res.ok) throw new Error(data.error || `PATCH ${path} failed: ${res.status}`);
  return data as T;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path, { method: "DELETE" });
  const data = (await res.json().catch(() => ({}))) as ErrorBody;
  if (!res.ok) throw new Error(data.error || `DELETE ${path} failed: ${res.status}`);
  return data as T;
}

export function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg || fallback;
}

export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizePath(input: string): string {
  // Prevent path traversal and open redirects
  return input
    .replace(/[^a-zA-Z0-9-_/]/g, "")
    .replace(/\.\./g, "")
    .replace(/^\//, "");
}
