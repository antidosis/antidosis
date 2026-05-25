import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before dynamic imports so they are hoisted by vitest
const mockProfileFindUnique = vi.fn();
const mockProfileFindFirst = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      findFirst: (...args: unknown[]) => mockProfileFindFirst(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
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

function makeRequest(body: string, signature?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (signature) {
    headers["stripe-signature"] = signature;
  }
  return new Request("http://localhost/api/v1/billing/webhook", {
    method: "POST",
    body,
    headers,
  }) as NextRequest;
}

describe("POST /api/v1/billing/webhook", () => {
  let POST: typeof import("./route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    vi.resetModules();
    const mod = await import("./route");
    POST = mod.POST;
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await POST(makeRequest("payload"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing stripe-signature");
  });

  it("returns 400 when signature is invalid", async () => {
    const err = new Error("Invalid signature");
    mockConstructEvent.mockImplementation(() => {
      throw err;
    });

    const res = await POST(makeRequest("payload", "bad_sig"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid signature");
    expect(mockConstructEvent).toHaveBeenCalledWith("payload", "bad_sig", "whsec_test");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Webhook signature verification failed",
      expect.objectContaining({ message: "Invalid signature" })
    );
  });

  it("activates Pro on checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: {
            userId: "user-1",
            profileId: "profile-1",
          },
          subscription: "sub_123",
        },
      },
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest("payload", "sig_1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        isPro: true,
        stripeSubscriptionId: "sub_123",
      },
    });
  });

  it("deactivates Pro on customer.subscription.deleted", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_456",
          customer: "cus_123",
        },
      },
    });
    mockProfileFindFirst.mockResolvedValue({
      id: "profile-2",
      stripeCustomerId: "cus_123",
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest("payload", "sig_2"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockProfileFindFirst).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
    });
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-2" },
      data: {
        isPro: false,
        stripeSubscriptionId: null,
      },
    });
  });

  it("deactivates Pro on customer.subscription.updated with canceled status", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_3",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_789",
          customer: "cus_789",
          status: "canceled",
        },
      },
    });
    mockProfileFindFirst.mockResolvedValue({
      id: "profile-3",
      stripeCustomerId: "cus_789",
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest("payload", "sig_3"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-3" },
      data: {
        isPro: false,
        stripeSubscriptionId: null,
      },
    });
  });

  it("deactivates Pro on customer.subscription.updated with unpaid status", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_4",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_999",
          customer: "cus_999",
          status: "unpaid",
        },
      },
    });
    mockProfileFindFirst.mockResolvedValue({
      id: "profile-4",
      stripeCustomerId: "cus_999",
    });
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest("payload", "sig_4"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-4" },
      data: {
        isPro: false,
        stripeSubscriptionId: null,
      },
    });
  });

  it("does not deactivate Pro on customer.subscription.updated with active status", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_5",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_555",
          customer: "cus_555",
          status: "active",
        },
      },
    });

    const res = await POST(makeRequest("payload", "sig_5"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockProfileFindFirst).not.toHaveBeenCalled();
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 for unhandled event types and logs it", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_6",
      type: "invoice.payment_succeeded",
      data: {
        object: {},
      },
    });

    const res = await POST(makeRequest("payload", "sig_6"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "Unhandled Stripe event type: invoice.payment_succeeded"
    );
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 on processing error", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_7",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_7",
          metadata: {
            userId: "user-1",
            profileId: "profile-1",
          },
          subscription: "sub_7",
        },
      },
    });
    const dbError = new Error("Database connection lost");
    mockProfileUpdate.mockRejectedValue(dbError);

    const res = await POST(makeRequest("payload", "sig_7"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Webhook processing failed",
      expect.objectContaining({ message: "Database connection lost" })
    );
  });
});
