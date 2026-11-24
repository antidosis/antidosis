import { NextRequest, NextResponse } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

const mockUpdateSession = vi.fn();
const mockAuditLog = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

function request(path: string, method = "GET") {
  return new NextRequest(`https://antidosis.com${path}`, { method });
}

describe("proxy direct invitation boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLog.mockResolvedValue(undefined);
    mockUpdateSession.mockResolvedValue({ response: NextResponse.next(), user: null });
  });

  it("allows a logged-out recipient to open the join page", async () => {
    const response = await proxy(request("/contracts/join/token-123"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows the read-only invitation preview", async () => {
    const response = await proxy(request("/api/v1/contracts/invite/token-123"));
    expect(response.status).toBe(200);
  });

  it("still requires authentication to claim an invitation", async () => {
    const response = await proxy(request("/api/v1/contracts/invite/token-123", "POST"));
    expect(response.status).toBe(401);
  });

  it("keeps other contract pages protected", async () => {
    const response = await proxy(request("/contracts/contract-123"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?next=");
  });

  it("keeps other contract APIs protected", async () => {
    const response = await proxy(request("/api/v1/contracts/contract-123"));
    expect(response.status).toBe(401);
  });

  it("allows an authenticated verified member into contracts", async () => {
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "user-1", email: "person@example.com", email_confirmed_at: "2026-01-01" },
    });
    const response = await proxy(request("/contracts/contract-123"));
    expect(response.status).toBe(200);
  });
});
