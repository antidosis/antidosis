import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// Mock dependencies
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

const mockRateLimit = vi.fn();
const mockGetRateLimitIdentifier = vi.fn().mockReturnValue("ratelimit-id");

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: (...args: unknown[]) => mockGetRateLimitIdentifier(...args),
}));

const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: {
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  },
}));

const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

function makeRequest(): NextRequest {
  return new Request("http://localhost/api/v1/billing/checkout", {
    method: "POST",
  }) as NextRequest;
}

describe("POST /api/v1/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRateLimitIdentifier.mockReturnValue("ratelimit-id");
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 3600000 });
  });

  it("returns 401 when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: null },
      },
      error: null,
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Email verification required");
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile is not found", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
    expect(mockProfileFindUnique).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("returns 403 when identity is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      isVerified: false,
      mobileVerified: true,
      stripeCustomerId: null,
      email: "test@example.com",
      fullName: "Test User",
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Identity verification required");
    expect(body.code).toBe("IDENTITY_NOT_VERIFIED");
  });

  it("returns 403 when mobile is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      isVerified: true,
      mobileVerified: false,
      stripeCustomerId: null,
      email: "test@example.com",
      fullName: "Test User",
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Mobile verification required");
    expect(body.code).toBe("MOBILE_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      isVerified: true,
      mobileVerified: true,
      stripeCustomerId: null,
      email: "test@example.com",
      fullName: "Test User",
    });
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3600000,
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Too many checkout attempts. Please try again later.");
  });

  it("returns 500 when Stripe price ID is not configured", async () => {
    const originalPriceId = process.env.STRIPE_PRICE_ID;
    delete (process.env as Record<string, string>).STRIPE_PRICE_ID;

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      isVerified: true,
      mobileVerified: true,
      stripeCustomerId: "cus_existing",
      email: "test@example.com",
      fullName: "Test User",
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Stripe price ID not configured");

    process.env.STRIPE_PRICE_ID = originalPriceId;
  });

  it("returns 200 and creates a new Stripe customer when none exists", async () => {
    process.env.STRIPE_PRICE_ID = "price_123";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      isVerified: true,
      mobileVerified: true,
      stripeCustomerId: null,
      email: "test@example.com",
      fullName: "Test User",
    });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
    mockProfileUpdate.mockResolvedValue({});
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_new",
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/session_new");

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "test@example.com",
      name: "Test User",
      metadata: {
        userId: "user-1",
        profileId: "profile-1",
      },
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { stripeCustomerId: "cus_new" },
    });

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_new",
      line_items: [
        {
          price: "price_123",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "https://app.example.com/pro/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://app.example.com/pro",
      metadata: {
        userId: "user-1",
        profileId: "profile-1",
      },
    });
  });

  it("returns 200 and reuses existing Stripe customer", async () => {
    process.env.STRIPE_PRICE_ID = "price_123";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email_confirmed_at: new Date().toISOString() },
      },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      isVerified: true,
      mobileVerified: true,
      stripeCustomerId: "cus_existing",
      email: "test@example.com",
      fullName: "Test User",
    });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_existing",
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/session_existing");

    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockProfileUpdate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing",
      })
    );
  });

  it("returns 500 on unexpected error", async () => {
    mockGetUser.mockRejectedValue(new Error("Supabase down"));

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Checkout failed",
      expect.objectContaining({ message: "Supabase down" })
    );
  });
});
