"use client";

export async function apiGet(path: string): Promise<any> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body?: any): Promise<any> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `POST ${path} failed: ${res.status}`);
  return data;
}

export async function apiPatch(path: string, body: any): Promise<any> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `PATCH ${path} failed: ${res.status}`);
  return data;
}

export async function apiDelete(path: string): Promise<any> {
  const res = await fetch(path, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `DELETE ${path} failed: ${res.status}`);
  return data;
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
