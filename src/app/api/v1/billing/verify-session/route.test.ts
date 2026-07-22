import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockCheckoutSessionsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: (...args: unknown[]) => mockCheckoutSessionsRetrieve(...args),
      },
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

function makeRequest(sessionId?: string): NextRequest {
  const url = sessionId
    ? `http://localhost/api/v1/billing/verify-session?session_id=${sessionId}`
    : "http://localhost/api/v1/billing/verify-session";
  return new Request(url, { method: "GET" }) as NextRequest;
}

describe("GET /api/v1/billing/verify-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when session_id is missing", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing session_id");
  });

  it("returns 402 when payment is not completed", async () => {
    mockCheckoutSessionsRetrieve.mockResolvedValue({
      id: "cs_unpaid",
      payment_status: "unpaid",
      customer: "cus_123",
      subscription: "sub_123",
    });

    const res = await GET(makeRequest("cs_unpaid"));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.error).toBe("Payment not completed");
    expect(body.status).toBe("unpaid");
    expect(mockCheckoutSessionsRetrieve).toHaveBeenCalledWith("cs_unpaid");
  });

  it("returns 200 with customer and subscription IDs when paid", async () => {
    mockCheckoutSessionsRetrieve.mockResolvedValue({
      id: "cs_paid",
      payment_status: "paid",
      customer: "cus_123",
      subscription: "sub_456",
    });

    const res = await GET(makeRequest("cs_paid"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(body.customerId).toBe("cus_123");
    expect(body.subscriptionId).toBe("sub_456");
  });

  it("returns 400 for invalid session (Stripe error)", async () => {
    const stripeError = new Error("No such checkout session: 'cs_invalid'");
    mockCheckoutSessionsRetrieve.mockRejectedValue(stripeError);

    const res = await GET(makeRequest("cs_invalid"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid session");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "[API:/api/v1/billing/verify-session]",
      expect.objectContaining({ message: "No such checkout session: 'cs_invalid'" })
    );
  });
});
