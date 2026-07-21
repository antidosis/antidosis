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

const mockVerifyIdToken = vi.fn();
const mockGoogleApiRequest = vi.fn();
const mockGetClient = vi.fn();

vi.mock("google-auth-library", () => ({
  OAuth2Client: class MockOAuth2Client {
    verifyIdToken(...args: unknown[]) {
      return mockVerifyIdToken(...args);
    }
  },
  GoogleAuth: class MockGoogleAuth {
    getClient() {
      return mockGetClient();
    }
  },
}));

function encodeNotification(notification: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(notification)).toString("base64");
}

function makeRequest(payload: {
  messageId?: string;
  data: string;
  subscription?: string;
  authed?: boolean;
}): NextRequest {
  const {
    messageId,
    data,
    subscription = "projects/test/subscriptions/test",
    authed = true,
  } = payload;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authed) {
    headers.Authorization = "Bearer valid-oidc-token";
  }
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
    headers,
  }) as NextRequest;
}

function subNotification(notificationType: number, purchaseToken = "token-abc") {
  return {
    version: "1.0",
    packageName: "com.antidosis.app",
    eventTimeMillis: Date.now().toString(),
    subscriptionNotification: {
      version: "1.0",
      notificationType,
      purchaseToken,
      subscriptionId: "sub-pro",
    },
  };
}

describe("POST /api/v1/billing/play-store/webhook", () => {
  let POST: typeof import("./route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.PLAY_RTDN_PUSH_AUDIENCE = "test-audience";
    process.env.PLAY_RTDN_SERVICE_ACCOUNT_EMAIL = "";
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.antidosis.app";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH = "/path/to/key.json";

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: "push-sa@test.iam.gserviceaccount.com" }),
    });
    mockGetClient.mockResolvedValue({
      request: (...args: unknown[]) => mockGoogleApiRequest(...args),
    });

    vi.resetModules();
    const mod = await import("./route");
    POST = mod.POST;
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await POST(makeRequest({ data: encodeNotification({}), authed: false }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLoggerWarn).toHaveBeenCalledWith("[RTDN] Unauthenticated push rejected");
  });

  it("returns 401 when the OIDC token fails verification", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("invalid token"));

    const res = await POST(makeRequest({ data: encodeNotification({}) }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("fails closed when PLAY_RTDN_PUSH_AUDIENCE is not configured", async () => {
    delete process.env.PLAY_RTDN_PUSH_AUDIENCE;

    const res = await POST(makeRequest({ data: encodeNotification({}) }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "[RTDN] PLAY_RTDN_PUSH_AUDIENCE is not configured; rejecting push"
    );
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
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-oidc-token",
      },
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

    const res1 = await POST(makeRequest({ messageId, data: encodeNotification(notification) }));
    expect(res1.status).toBe(200);

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

  it("activates Pro when Google reports the subscription ACTIVE", async () => {
    mockProfileFindFirst.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockProfileUpdate.mockResolvedValue({});
    mockGoogleApiRequest.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [
          {
            productId: "sub-pro",
            expiryTime: "2027-01-01T00:00:00Z",
            autoRenewingPlan: { autoRenewEnabled: true },
          },
        ],
      },
    });

    const res = await POST(
      makeRequest({ messageId: "msg-purchased", data: encodeNotification(subNotification(4)) })
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
        proExpiresAt: new Date("2027-01-01T00:00:00Z"),
      },
    });
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] Subscription state synced",
      expect.objectContaining({
        userId: "user-1",
        state: "SUBSCRIPTION_STATE_ACTIVE",
        entitled: true,
      })
    );
  });

  it("deactivates Pro when Google reports the subscription EXPIRED", async () => {
    mockProfileFindFirst.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockProfileUpdate.mockResolvedValue({});
    mockGoogleApiRequest.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_EXPIRED",
        lineItems: [
          {
            productId: "sub-pro",
            expiryTime: "2020-01-01T00:00:00Z",
            autoRenewingPlan: { autoRenewEnabled: false },
          },
        ],
      },
    });

    const res = await POST(
      makeRequest({ messageId: "msg-expired", data: encodeNotification(subNotification(13)) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        isPro: false,
        playStoreProductId: "sub-pro",
        playStoreAutoRenewing: false,
        proExpiresAt: new Date("2020-01-01T00:00:00Z"),
      },
    });
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[RTDN] Subscription state synced",
      expect.objectContaining({
        userId: "user-1",
        state: "SUBSCRIPTION_STATE_EXPIRED",
        entitled: false,
      })
    );
  });

  it("never derives Pro status from the notification body alone", async () => {
    // A forged "PURCHASED" body whose authoritative state is EXPIRED must not grant Pro
    mockProfileFindFirst.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockProfileUpdate.mockResolvedValue({});
    mockGoogleApiRequest.mockResolvedValue({
      data: {
        subscriptionState: "SUBSCRIPTION_STATE_EXPIRED",
        lineItems: [],
      },
    });

    const res = await POST(
      makeRequest({ messageId: "msg-forged", data: encodeNotification(subNotification(4)) })
    );

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { isPro: false },
    });
  });

  it("returns 200 when profile is not found for purchase token", async () => {
    mockProfileFindFirst.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        messageId: "msg-no-profile",
        data: encodeNotification(subNotification(4, "unknown-token")),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.profileFound).toBe(false);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
    expect(mockGoogleApiRequest).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "[RTDN] Profile not found for purchase token",
      expect.objectContaining({
        purchaseToken: "unknown-...",
        subscriptionId: "sub-pro",
      })
    );
  });

  it("returns 500 when the Google Play API call fails", async () => {
    mockProfileFindFirst.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockGoogleApiRequest.mockRejectedValue(new Error("Google API error"));

    const res = await POST(
      makeRequest({ messageId: "msg-error", data: encodeNotification(subNotification(4)) })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Processing failed");
    expect(body.message).toBe("Google API error");
    expect(mockProfileUpdate).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      "[RTDN] Webhook processing failed",
      expect.objectContaining({ message: "Google API error" })
    );
  });
});
