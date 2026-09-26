import { NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockVerifyOtp = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args) },
  }),
}));

function req(url: string) {
  return new NextRequest(`https://antidosis.com${url}`);
}

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset();
  });

  it("verifies the token and redirects to next on success", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const res = await GET(req("/auth/confirm?token_hash=abc123&type=email&next=/needs"));

    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: "abc123", type: "email" });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://antidosis.com/needs");
  });

  it("redirects to /needs by default when next is missing", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const res = await GET(req("/auth/confirm?token_hash=abc123&type=recovery"));

    expect(res.headers.get("location")).toBe("https://antidosis.com/needs");
  });

  it("blocks open redirects via next", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const res = await GET(
      req("/auth/confirm?token_hash=abc123&type=email&next=https://evil.com/phish")
    );

    expect(res.headers.get("location")).toBe("https://antidosis.com/needs");
  });

  it("blocks protocol-relative next", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const res = await GET(req("/auth/confirm?token_hash=abc123&type=email&next=//evil.com"));

    expect(res.headers.get("location")).toBe("https://antidosis.com/needs");
  });

  it("rejects missing token_hash without calling verifyOtp", async () => {
    const res = await GET(req("/auth/confirm?type=email"));

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toMatch(/\/login\?error=/);
  });

  it("rejects unknown otp types without calling verifyOtp", async () => {
    const res = await GET(req("/auth/confirm?token_hash=abc123&type=totp"));

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toMatch(/\/login\?error=/);
  });

  it("redirects to login with the error message when verification fails", async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: "Token has expired or is invalid" } });

    const res = await GET(req("/auth/confirm?token_hash=abc123&type=email"));

    expect(res.headers.get("location")).toBe(
      "https://antidosis.com/login?error=Token%20has%20expired%20or%20is%20invalid"
    );
  });
});
