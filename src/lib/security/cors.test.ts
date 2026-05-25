import { NextResponse } from "next/server";

import { describe, it, expect, vi } from "vitest";

import { withCors } from "./cors";

function makeRequest(method: string, origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("http://localhost/api/test", { method, headers }) as Request;
}

describe("withCors", () => {
  it("handles OPTIONS preflight from allowed origin", async () => {
    const handler = vi.fn();
    const wrapped = withCors(handler);
    const req = makeRequest("OPTIONS", "https://antidosis.com");

    const res = await wrapped(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://antidosis.com");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PATCH, OPTIONS");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
    expect(handler).not.toHaveBeenCalled();
  });

  it("handles OPTIONS preflight without origin", async () => {
    const handler = vi.fn();
    const wrapped = withCors(handler);
    const req = makeRequest("OPTIONS");

    const res = await wrapped(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("handles OPTIONS from disallowed origin", async () => {
    const handler = vi.fn();
    const wrapped = withCors(handler);
    const req = makeRequest("OPTIONS", "https://evil.com");

    const res = await wrapped(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("");
  });

  it("adds CORS headers to handler response from allowed origin", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withCors(handler);
    const req = makeRequest("GET", "https://antidosis.com");

    const res = await wrapped(req);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://antidosis.com");
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(handler).toHaveBeenCalledWith(req);
  });

  it("adds credentials header but no origin for disallowed origin", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withCors(handler);
    const req = makeRequest("GET", "https://evil.com");

    const res = await wrapped(req);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("allows capacitor://localhost origin", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withCors(handler);
    const req = makeRequest("GET", "capacitor://localhost");

    const res = await wrapped(req);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("capacitor://localhost");
  });

  it("allows localhost origins", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withCors(handler);

    for (const origin of ["http://localhost:3000", "http://localhost:5173"]) {
      const req = makeRequest("GET", origin);
      const res = await wrapped(req);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    }
  });
});
