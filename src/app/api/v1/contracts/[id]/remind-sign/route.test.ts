import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockContractUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    contract: {
      findUnique: (...args: unknown[]) => mockContractFindUnique(...args),
      update: (...args: unknown[]) => mockContractUpdate(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Email mock ───
const mockSendContractSignReminderEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendContractSignReminderEmail: (...args: unknown[]) => mockSendContractSignReminderEmail(...args),
}));

// ─── Notifications mock ───
const mockCreateNotification = vi.fn();
vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

function makeAuthUser(
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string | null }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeContract(overrides?: Record<string, unknown>) {
  return {
    id: "contract-1",
    partyAId: "prof-1",
    partyBId: "prof-2",
    status: "draft",
    termsLockedAt: new Date(),
    partyASignedAt: null,
    partyBSignedAt: null,
    lastSignReminderSentAt: null,
    needId: "need-1",
    need: { title: "Test Need" },
    partyA: { id: "prof-1", fullName: "Alice", email: "alice@example.com" },
    partyB: { id: "prof-2", fullName: "Bob", email: "bob@example.com" },
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/remind-sign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when email not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: null }) },
      error: null,
    });
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Alice" });
    mockContractFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Contract not found");
  });

  it("returns 403 when user is not a party", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-other", fullName: "Other" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 when terms not locked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Alice" });
    mockContractFindUnique.mockResolvedValue(makeContract({ termsLockedAt: null }));
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot remind at this stage");
  });

  it("returns 400 when contract status is not draft or pending_terms", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Alice" });
    mockContractFindUnique.mockResolvedValue(makeContract({ status: "active" }));
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cannot remind at this stage");
  });

  it("returns 400 when other party already signed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Alice" });
    mockContractFindUnique.mockResolvedValue(makeContract({ partyBSignedAt: new Date() }));
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("already signed");
  });

  it("returns 429 during cooldown", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Alice" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ lastSignReminderSentAt: new Date(Date.now() - 30 * 60 * 1000) })
    );
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Please wait");
  });

  it("returns 200 and sends reminder on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Alice" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ lastSignReminderSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) })
    );
    mockContractUpdate.mockResolvedValue({});
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/remind-sign", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSendContractSignReminderEmail).toHaveBeenCalled();
    expect(mockCreateNotification).toHaveBeenCalled();
    expect(mockContractUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastSignReminderSentAt: expect.any(Date) }),
      })
    );
  });
});
