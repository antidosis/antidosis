import { type z } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiClientConfig = {
  baseUrl?: string;
};

const DEFAULT_BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "http://localhost";

function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(endpoint, DEFAULT_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function parseResponse<T>(res: Response, schema?: z.ZodSchema<T>): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const body = isJson ? await res.json().catch(() => null) : await res.text();
    throw new ApiError(body?.error || `HTTP ${res.status}`, res.status, body);
  }

  if (!isJson) {
    return undefined as T;
  }

  const json = await res.json();

  if (schema) {
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError(`Response validation failed: ${parsed.error.message}`, res.status, json);
    }
    return parsed.data;
  }

  return json as T;
}

export async function apiGet<T>(
  endpoint: string,
  options?: {
    schema?: z.ZodSchema<T>;
    params?: Record<string, string | number | boolean | undefined>;
  }
): Promise<T> {
  const res = await fetch(buildUrl(endpoint, options?.params), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  return parseResponse(res, options?.schema);
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown,
  options?: {
    schema?: z.ZodSchema<T>;
  }
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  return parseResponse(res, options?.schema);
}

export async function apiPatch<T>(
  endpoint: string,
  body: unknown,
  options?: {
    schema?: z.ZodSchema<T>;
  }
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  return parseResponse(res, options?.schema);
}

export async function apiDelete<T>(
  endpoint: string,
  options?: {
    schema?: z.ZodSchema<T>;
  }
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  return parseResponse(res, options?.schema);
}
