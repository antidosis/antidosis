import { describe, it, expect } from "vitest";

import { rateLimit, getRateLimitIdentifier } from "./rate-limit";

describe("rateLimit (memory fallback)", () => {
  const options = { windowMs: 1000, maxRequests: 3 };

  it("allows first request", async () => {
    const result = await rateLimit("test-key-1", options);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("allows up to max requests", async () => {
    await rateLimit("test-key-2", options);
    await rateLimit("test-key-2", options);
    const third = await rateLimit("test-key-2", options);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks after max requests", async () => {
    const key = "test-key-3";
    await rateLimit(key, options);
    await rateLimit(key, options);
    await rateLimit(key, options);
    const fourth = await rateLimit(key, options);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const key = "test-key-4";
    const shortWindow = { windowMs: 50, maxRequests: 1 };

    const first = await rateLimit(key, shortWindow);
    expect(first.allowed).toBe(true);

    const second = await rateLimit(key, shortWindow);
    expect(second.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));

    const third = await rateLimit(key, shortWindow);
    expect(third.allowed).toBe(true);
  });

  it("uses default options when none provided", async () => {
    const result = await rateLimit("test-key-default");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(29); // default maxRequests: 30
  });

  it("returns correct resetAt timestamp", async () => {
    const before = Date.now();
    const result = await rateLimit("test-key-5", options);
    const after = Date.now();

    expect(result.resetAt).toBeGreaterThanOrEqual(before + options.windowMs);
    expect(result.resetAt).toBeLessThanOrEqual(after + options.windowMs + 50);
  });
});

describe("getRateLimitIdentifier", () => {
  it("uses userId when provided", () => {
    const req = new Request("http://localhost");
    const id = getRateLimitIdentifier(req, "user-123");
    expect(id).toBe("user:user-123");
  });

  it("uses x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    const id = getRateLimitIdentifier(req);
    expect(id).toBe("ip:192.168.1.1");
  });

  it("falls back to unknown when no IP", () => {
    const req = new Request("http://localhost");
    const id = getRateLimitIdentifier(req);
    expect(id).toBe("ip:unknown");
  });

  it("prefers userId over IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });
    const id = getRateLimitIdentifier(req, "user-456");
    expect(id).toBe("user:user-456");
  });
});
