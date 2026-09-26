import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { GET } from "./route";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function req(auth?: string) {
  return new Request("http://localhost/api/cron/keep-alive", {
    headers: auth ? { authorization: auth } : {},
  }) as unknown as NextRequest;
}

describe("GET /api/cron/keep-alive", () => {
  const ORIGINAL = {
    cron: process.env.CRON_SECRET,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  beforeEach(() => {
    mockFetch.mockReset();
    process.env.CRON_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL.cron;
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL.url;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL.key;
  });

  it("fails closed when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req("Bearer anything"));
    expect(res.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects missing or wrong authorization", async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req("Bearer wrong"))).status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("pings the Supabase auth health endpoint with the anon key", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/health",
      expect.objectContaining({ headers: { apikey: "anon-key" } })
    );
  });

  it("returns 502 when Supabase responds with an error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe(500);
  });
});
