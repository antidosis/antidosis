import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockProfileFindFirst = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findFirst: (...args: unknown[]) => mockProfileFindFirst(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

const mockLoggerInfo = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

function makeRequest(payload: {
  messageId?: string;
  data: string;
  subscription?: string;
}): NextRequest {
  const { messageId, data, subscription = "projects/test/subscriptions/test" } = payload;
  return new Request("http://localhost/api/v1/billing/play-store/webhook", {
    method: "POST",
    body: JSON.stringify({
      message: {
        messageId: messageId ?? "msg-1",
        publishTime: new Date().toISOString(),
        data,
      },
      subscription,
    }),
    headers: { "Content-Type": "application/json" },
  }) as NextRequest;
}

function encodeNotification(notification: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(notification)).toString("base64");
}

describe("POST /api/v1/billing/play-store/webhook", () => {
  let POST: typeof import("./route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import("./route");
    POST = mod.POST;
  });

  it("returns 400 when messageId is missing", async () => {
    const req = new Request("http://localhost/api/v1/billing/play-store/webhook", {
      method: "POST",
      body: JSON.stringify({
        message: {
          publishTime: new Date().toISOString(),
          data: encodeNotification({}),
        },
        subscription: "projects/test/subscriptions/test",
      }),
      headers: { "Content-Type": "application/json" },
    }) as NextRequest;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing messageId");
  });

  it("returns 200 and skips duplicate messages (idempotency)", async () => {
    const messageId = "msg-dup-1";
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      testNotification: { version: "1.0" },
    };

    // First request
    const res1 = await POST(makeRequest({ messageId, data: encodeNotification(notification) }));
    expect(res1.status).toBe(200);

    // Duplicate request
    const res2 = await POST(makeRequest({ messageId, data: encodeNotification(notification) }));
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.success).toBe(true);
    expect(body2.duplicate).toBe(true);
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] Duplicate message skipped",
      expect.objectContaining({ messageId })
    );
  });

  it("returns 200 for test notifications", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      testNotification: { version: "1.0" },
    };

    const res = await POST(
      makeRequest({ messageId: "msg-test", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.test).toBe(true);
    expect(mockLoggerInfo).toHaveBeenCalledWith("[RTDN] Test notification received");
  });

  it("activates Pro on SUBSCRIPTION_PURCHASED (type 4)", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      subscriptionNotification: {
        version: "1.0",
        notificationType: 4,
        purchaseToken: "token-abc",
        subscriptionId: "sub-pro",
      },
    };

    mockProfileFindFirst.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(
      makeRequest({ messageId: "msg-purchased", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockProfileFindFirst).toHaveBeenCalledWith({
      where: { playStorePurchaseToken: "token-abc" },
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        isPro: true,
        playStoreProductId: "sub-pro",
        playStoreAutoRenewing: true,
      },
    });

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] Pro activated/renewed",
      expect.objectContaining({ userId: "user-1", type: 4 })
    );
  });

  it("disables auto-renew on SUBSCRIPTION_CANCELED (type 3)", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      subscriptionNotification: {
        version: "1.0",
        notificationType: 3,
        purchaseToken: "token-abc",
        subscriptionId: "sub-pro",
      },
    };

    mockProfileFindFirst.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(
      makeRequest({ messageId: "msg-canceled", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        playStoreAutoRenewing: false,
      },
    });

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] Subscription cancelled (auto-renew off)",
      expect.objectContaining({ userId: "user-1" })
    );
  });

  it("deactivates Pro on SUBSCRIPTION_EXPIRED (type 13)", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      subscriptionNotification: {
        version: "1.0",
        notificationType: 13,
        purchaseToken: "token-abc",
        subscriptionId: "sub-pro",
      },
    };

    mockProfileFindFirst.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(
      makeRequest({ messageId: "msg-expired", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        isPro: false,
        playStoreAutoRenewing: false,
        proExpiresAt: expect.any(Date),
      },
    });

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] Pro deactivated",
      expect.objectContaining({ userId: "user-1", type: 13 })
    );
  });

  it("returns 200 for no-op notification type (SUBSCRIPTION_DEFERRED, type 9)", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      subscriptionNotification: {
        version: "1.0",
        notificationType: 9,
        purchaseToken: "token-abc",
        subscriptionId: "sub-pro",
      },
    };

    mockProfileFindFirst.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
    });

    const res = await POST(
      makeRequest({ messageId: "msg-deferred", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(mockProfileUpdate).not.toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] No-op notification type",
      expect.objectContaining({ userId: "user-1", type: 9 })
    );
  });

  it("returns 200 when profile is not found for purchase token", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      subscriptionNotification: {
        version: "1.0",
        notificationType: 4,
        purchaseToken: "unknown-token",
        subscriptionId: "sub-pro",
      },
    };

    mockProfileFindFirst.mockResolvedValue(null);

    const res = await POST(
      makeRequest({ messageId: "msg-no-profile", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.profileFound).toBe(false);

    expect(mockProfileUpdate).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "[RTDN] Profile not found for purchase token",
      expect.objectContaining({
        purchaseToken: "unknown-...",
        subscriptionId: "sub-pro",
      })
    );
  });

  it("returns 500 on unexpected processing error", async () => {
    const notification = {
      version: "1.0",
      packageName: "com.antidosis.app",
      eventTimeMillis: Date.now().toString(),
      subscriptionNotification: {
        version: "1.0",
        notificationType: 4,
        purchaseToken: "token-abc",
        subscriptionId: "sub-pro",
      },
    };

    mockProfileFindFirst.mockRejectedValue(new Error("Database error"));

    const res = await POST(
      makeRequest({ messageId: "msg-error", data: encodeNotification(notification) })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Processing failed");
    expect(body.message).toBe("Database error");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "[RTDN] Webhook processing failed",
      expect.objectContaining({ message: "Database error" })
    );
  });
});
