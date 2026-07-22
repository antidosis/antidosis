import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./route";

// ─── Prisma mocks ───
const mockAcceptanceFindUnique = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockAcceptanceUpdate = vi.fn();
const mockNeedUpdate = vi.fn();
const mockAcceptanceUpdateMany = vi.fn();
const mockTransaction = vi.fn();

const mockTx = {
  need: { update: vi.fn() },
  acceptance: { updateMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    acceptance: {
      findUnique: (...args: unknown[]) => mockAcceptanceFindUnique(...args),
      update: (...args: unknown[]) => mockAcceptanceUpdate(...args),
      updateMany: (...args: unknown[]) => mockAcceptanceUpdateMany(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    contract: {
      findUnique: (...args: unknown[]) => mockContractFindUnique(...args),
    },
    need: {
      update: (...args: unknown[]) => mockNeedUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

// ─── Notifications mock ───
const mockCreateNotification = vi.fn();
vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ─── Contract formation mock ───
const mockCreateContractFromAcceptance = vi.fn();
vi.mock("@/lib/contract-formation", () => ({
  createContractFromAcceptance: (...args: unknown[]) => mockCreateContractFromAcceptance(...args),
}));

// ─── Email mock ───
const mockSendInterestAcceptedEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendInterestAcceptedEmail: (...args: unknown[]) => mockSendInterestAcceptedEmail(...args),
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

async function flushPromises() {
  await new Promise((r) => setTimeout(r, 10));
}

describe("PATCH /api/v1/acceptances/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockSendInterestAcceptedEmail.mockResolvedValue(undefined);
    mockCreateNotification.mockResolvedValue(undefined);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when email not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: null }) },
      error: null,
    });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 400 for invalid body", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "invalid" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(400);
  });

  it("returns 404 when acceptance not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue(null);
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Acceptance not found");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "p1" },
      userId: "u1",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue(null);
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns 403 when withdrawing as non-creator", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "p1" },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "withdrawn" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 when withdrawing already selected acceptance", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "p1" },
      userId: "prof-1",
      needId: "n1",
      status: "selected",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "withdrawn" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Cannot withdraw");
  });

  it("returns 403 when non-poster tries accepted/declined/selected/removed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "p1" },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 when removing already selected acceptance", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1" },
      userId: "u2",
      needId: "n1",
      status: "selected",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "removed" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Cannot remove");
  });

  it("returns 400 when selecting acceptance that does not require contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1", requiresContract: false },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "selected" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("does not require a formal contract");
  });

  it("returns 409 when selecting acceptance with existing non-cancelled contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1", requiresContract: true },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    mockContractFindUnique.mockResolvedValue({ id: "c1", status: "draft" });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "selected" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already exists");
  });

  it("creates contract and returns 200 on select success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValueOnce({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1", requiresContract: true },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Test" });
    mockContractFindUnique.mockResolvedValue(null);
    mockCreateContractFromAcceptance.mockResolvedValue({ id: "contract-1" });
    mockAcceptanceFindUnique.mockResolvedValueOnce({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      status: "selected",
    });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "selected" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contract.id).toBe("contract-1");
    expect(mockCreateContractFromAcceptance).toHaveBeenCalledWith(
      "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "prof-1"
    );
  });

  it("accepts interest with contract required and notifies fulfiller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1", title: "Need title", requiresContract: true },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "prof-1", fullName: "Poster" })
      .mockResolvedValueOnce({ id: "u2", email: "fulfiller@example.com", fullName: "Fulfiller" });
    mockAcceptanceUpdate.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      status: "accepted",
    });
    mockNeedUpdate.mockResolvedValue({});
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    await flushPromises();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.acceptance.status).toBe("accepted");
    expect(mockNeedUpdate).toHaveBeenCalled();
    expect(mockSendInterestAcceptedEmail).toHaveBeenCalled();
    expect(mockCreateNotification).toHaveBeenCalled();
  });

  it("accepts free-form interest, activates need, declines others, and notifies", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1", title: "Need title", requiresContract: false },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "prof-1", fullName: "Poster" })
      .mockResolvedValueOnce({ id: "u2", email: "fulfiller@example.com", fullName: "Fulfiller" });
    mockAcceptanceUpdate.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      status: "accepted",
    });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    await flushPromises();
    expect(res.status).toBe(200);
    expect(mockTx.need.update).toHaveBeenCalled();
    expect(mockTx.acceptance.updateMany).toHaveBeenCalled();
    expect(mockSendInterestAcceptedEmail).toHaveBeenCalled();
  });

  it("updates status to declined", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "prof-1" },
      userId: "u2",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Poster" });
    mockAcceptanceUpdate.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      status: "declined",
    });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "declined" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.acceptance.status).toBe("declined");
  });

  it("withdraws as creator", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockAcceptanceFindUnique.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      need: { posterId: "p1" },
      userId: "prof-1",
      needId: "n1",
      status: "pending",
    });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", fullName: "Creator" });
    mockAcceptanceUpdate.mockResolvedValue({
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      status: "withdrawn",
    });
    const req = makeRequest("http://localhost/api/v1/acceptances/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "withdrawn" }),
    });
    const res = await PATCH(req, { params: { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.acceptance.status).toBe("withdrawn");
  });
});
