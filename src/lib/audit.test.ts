import { describe, it, expect, vi, beforeEach } from "vitest";

import { auditLog, getClientInfo } from "./audit";

const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("auditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates audit log with all fields", async () => {
    mockCreate.mockResolvedValueOnce({ id: "audit-1" });
    await auditLog({
      event: "NEED_CREATED",
      userId: "user-1",
      email: "test@example.com",
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      path: "/api/v1/needs",
      metadata: { needId: "need-1" },
      severity: "info",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: "NEED_CREATED",
        userId: "user-1",
        email: "test@example.com",
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        path: "/api/v1/needs",
        metadata: { needId: "need-1" },
        severity: "info",
      }),
    });
  });

  it("handles minimal audit log", async () => {
    mockCreate.mockResolvedValueOnce({ id: "audit-2" });
    await auditLog({ event: "LOGIN_SUCCESS" });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: "LOGIN_SUCCESS",
        userId: null,
        email: null,
        ip: null,
        userAgent: null,
        path: null,
        metadata: null,
        severity: "info",
      }),
    });
  });

  it("does not throw when DB write fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("DB down"));
    await expect(auditLog({ event: "LOGIN_FAILURE" })).resolves.not.toThrow();
  });

  it("uses default severity when not specified", async () => {
    mockCreate.mockResolvedValueOnce({ id: "audit-3" });
    await auditLog({ event: "PROFILE_UPDATED" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "info" }),
      })
    );
  });

  it("handles warning severity", async () => {
    mockCreate.mockResolvedValueOnce({ id: "audit-4" });
    await auditLog({ event: "RATE_LIMIT_HIT", severity: "warning" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "warning" }),
      })
    );
  });
});

describe("getClientInfo", () => {
  it("extracts IP and user-agent from request", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        "user-agent": "Mozilla/5.0",
      },
    });
    const info = getClientInfo(req);
    expect(info.ip).toBe("192.168.1.1");
    expect(info.userAgent).toBe("Mozilla/5.0");
  });

  it("returns unknown for missing headers", () => {
    const req = new Request("http://localhost");
    const info = getClientInfo(req);
    expect(info.ip).toBe("unknown");
    expect(info.userAgent).toBe("unknown");
  });

  it("trims whitespace from forwarded IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  192.168.1.1  " },
    });
    const info = getClientInfo(req);
    expect(info.ip).toBe("192.168.1.1");
  });
});
