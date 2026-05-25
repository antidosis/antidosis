import { type NextRequest, NextResponse } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { withApiHandler } from "./api-handler";

const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

function makeRequest(url: string, method = "GET"): NextRequest {
  return new Request(url, { method }) as NextRequest;
}

describe("withApiHandler", () => {
  beforeEach(() => {
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
  });

  it("returns handler response on success", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }, { status: 200 }));
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test");

    const res = await wrapped(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("injects x-request-id header into response", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test");

    const res = await wrapped(req);

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });

  it("logs request start and completion", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test", "POST");

    await wrapped(req);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo.mock.calls[0][0]).toBe("API request started");
    expect(mockLoggerInfo.mock.calls[0][1]).toMatchObject({
      method: "POST",
      path: "/api/test",
    });
    expect(mockLoggerInfo.mock.calls[1][0]).toBe("API request completed");
    expect(mockLoggerInfo.mock.calls[1][1]).toMatchObject({
      method: "POST",
      path: "/api/test",
      status: 200,
    });
    expect(mockLoggerInfo.mock.calls[1][1].latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("returns 500 with requestId when handler throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("boom"));
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test");

    const res = await wrapped(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(body.requestId).toBeDefined();
    expect(res.headers.get("x-request-id")).toBe(body.requestId);
  });

  it("logs error when handler throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("boom"));
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test");

    await wrapped(req);

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError.mock.calls[0][0]).toBe("API request failed");
    expect(mockLoggerError.mock.calls[0][1]).toBeInstanceOf(Error);
    expect(mockLoggerError.mock.calls[0][1].message).toBe("boom");
    expect(mockLoggerError.mock.calls[0][2]).toMatchObject({
      method: "GET",
      path: "/api/test",
    });
  });

  it("returns 500 with requestId for non-Error throws", async () => {
    const handler = vi.fn().mockRejectedValue("string error");
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test");

    const res = await wrapped(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(body.requestId).toBeDefined();
  });

  it("forwards additional args to handler", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiHandler(handler);
    const req = makeRequest("http://localhost/api/test");
    const extra = { params: { id: "123" } };

    await wrapped(req, extra);

    expect(handler).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ requestId: expect.any(String), startTime: expect.any(Number) }),
      extra
    );
  });
});
