import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { GET } from "./route";

const mockTransaction = vi.fn();
const mockDeleteMany = vi.fn().mockResolvedValue({ count: 0 });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (ops: unknown[]) => mockTransaction(ops),
    mobileVerificationCode: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) },
    auditLog: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) },
    notification: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) },
    terminalMessage: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) },
    directMessage: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) },
  },
}));

function req(auth?: string) {
  return new Request("http://localhost/api/cron/purge", {
    headers: auth ? { authorization: auth } : {},
  }) as unknown as NextRequest;
}

describe("GET /api/cron/purge", () => {
  const ORIGINAL = process.env.CRON_SECRET;

  beforeEach(() => {
    mockTransaction.mockReset();
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL;
  });

  it("fails closed when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req("Bearer anything"));
    expect(res.status).toBe(503);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects missing or wrong authorization", async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req("Bearer wrong"))).status).toBe(401);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("purges all retention categories and returns counts", async () => {
    mockTransaction.mockResolvedValue([
      { count: 3 },
      { count: 10 },
      { count: 5 },
      { count: 2 },
      { count: 1 },
    ]);

    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted).toEqual({
      otpCodes: 3,
      auditLogs: 10,
      notifications: 5,
      terminalMessages: 2,
      directMessages: 1,
    });
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockTransaction.mock.calls[0][0]).toHaveLength(5);
  });
});
