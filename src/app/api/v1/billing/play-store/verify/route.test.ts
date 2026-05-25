import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockProfileFindUnique = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

const mockRequest = vi.fn();
const mockGetClient = vi.fn();
const mockGoogleAuth = vi.fn();

vi.mock("google-auth-library", () => ({
  GoogleAuth: class MockGoogleAuth {
    constructor(...args: unknown[]) {
      mockGoogleAuth(...args);
    }
    getClient() {
      return mockGetClient();
    }
  },
}));

function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/billing/play-store/verify", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  }) as NextRequest;
}

describe("POST /api/v1/billing/play-store/verify", () => {
  let POST: typeof import("./route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.antidosis.app";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH = "/path/to/key.json";

    mockGetClient.mockResolvedValue({
      request: (...args: unknown[]) => mockRequest(...args),
    });

    vi.resetModules();
    const mod = await import("./route");
    POST = mod.POST;
  });

  it("returns 401 when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ purchaseToken: "token", productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when purchaseToken is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const res = await POST(makeRequest({ productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing purchaseToken");
  });

  it("returns 400 when productId is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const res = await POST(makeRequest({ purchaseToken: "token" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing productId");
  });

  it("returns 404 when profile is not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ purchaseToken: "token", productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
    expect(mockProfileFindUnique).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("returns 402 when subscription is not active", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockRequest.mockResolvedValue({
      data: {
        subscriptionState: "3",
        lineItems: [{ productId: "prod", expiryTime: "2025-06-01T00:00:00Z" }],
      },
    });

    const res = await POST(makeRequest({ purchaseToken: "token", productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.error).toBe("Subscription not active");
    expect(body.state).toBe(3);
  });

  it("returns 200 and updates profile with Pro status on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      proActivatedAt: null,
    });
    mockRequest.mockResolvedValue({
      data: {
        subscriptionState: "1",
        lineItems: [
          {
            productId: "prod",
            expiryTime: "2025-12-31T23:59:59Z",
            autoRenewingPlan: { autoRenewEnabled: true },
          },
        ],
      },
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest({ purchaseToken: "token-abc", productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.productId).toBe("prod");
    expect(body.state).toBe(1);
    expect(body.expiresAt).toBe("2025-12-31T23:59:59.000Z");
    expect(body.autoRenewing).toBe(true);

    expect(mockGoogleAuth).toHaveBeenCalledWith({
      keyFile: "/path/to/key.json",
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    expect(mockRequest).toHaveBeenCalledWith({
      url: "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.antidosis.app/purchases/subscriptionsv2/tokens/token-abc",
      method: "GET",
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        isPro: true,
        proActivatedAt: expect.any(Date),
        proSource: "play_store",
        proExpiresAt: new Date("2025-12-31T23:59:59Z"),
        playStorePurchaseToken: "token-abc",
        playStoreProductId: "prod",
        playStoreAutoRenewing: true,
      },
    });

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "[PlayStore] Subscription verified",
      expect.objectContaining({
        userId: "user-1",
        productId: "prod",
        state: 1,
        expiresAt: "2025-12-31T23:59:59.000Z",
      })
    );
  });

  it("returns 200 and preserves existing proActivatedAt when already set", async () => {
    const existingDate = new Date("2025-01-01T00:00:00Z");

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      proActivatedAt: existingDate,
    });
    mockRequest.mockResolvedValue({
      data: {
        subscriptionState: "5",
        lineItems: [
          {
            productId: "prod",
            expiryTime: "2025-06-15T00:00:00Z",
            autoRenewingPlan: { autoRenewEnabled: false },
          },
        ],
      },
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest({ purchaseToken: "token-abc", productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.state).toBe(5);
    expect(body.autoRenewing).toBe(false);

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: expect.objectContaining({
        proActivatedAt: existingDate,
      }),
    });
  });

  it("returns 500 when Google Play verification throws an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
    mockRequest.mockRejectedValue(new Error("Google API error"));

    const res = await POST(makeRequest({ purchaseToken: "token", productId: "prod" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Verification failed");
    expect(body.message).toBe("Google API error");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "[PlayStore] Verification failed",
      expect.objectContaining({ message: "Google API error" })
    );
  });
});
