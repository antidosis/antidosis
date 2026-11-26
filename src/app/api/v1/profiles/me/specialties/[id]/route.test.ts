import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE, PATCH } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileUpdate = vi.fn();
const mockSpecialtyFindFirst = vi.fn();
const mockSpecialtyUpdate = vi.fn();
const mockSpecialtyDelete = vi.fn();
const mockSpecialtyCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
    directorySpecialty: {
      findFirst: (...args: unknown[]) => mockSpecialtyFindFirst(...args),
      update: (...args: unknown[]) => mockSpecialtyUpdate(...args),
      delete: (...args: unknown[]) => mockSpecialtyDelete(...args),
      count: (...args: unknown[]) => mockSpecialtyCount(...args),
    },
  },
}));

const mockResolveEntityId = vi.fn();

vi.mock("@/lib/resolve-id", () => ({
  resolveEntityId: (...args: unknown[]) => mockResolveEntityId(...args),
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Helpers ───
function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as NextRequest;
}

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockResolveEntityId.mockResolvedValue("specialty-1");
  mockProfileFindUnique.mockImplementation((args: { select?: Record<string, boolean> }) =>
    args?.select?.accountType !== undefined
      ? { accountType: "business", abn: "12345678901" }
      : { id: "profile-1", bannedAt: null }
  );
  mockSpecialtyFindFirst.mockResolvedValue({
    id: "specialty-1",
    profession: "plumber",
    headline: null,
    attributes: "{}",
    slot: 1,
  });
}

describe("DELETE /api/v1/profiles/me/specialties/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/specialties/specialty-1", {
        method: "DELETE",
      }),
      { params: { id: "specialty-1" } }
    );
    expect(res.status).toBe(401);
  });

  it("downgrades the account to individual when the last specialty is released", async () => {
    authed();
    mockSpecialtyCount.mockResolvedValue(0);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/specialties/specialty-1", {
        method: "DELETE",
      }),
      { params: { id: "specialty-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockSpecialtyDelete).toHaveBeenCalledWith({ where: { id: "specialty-1" } });
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: { accountType: "individual" },
      })
    );
  });

  it("keeps the account business while other specialties remain", async () => {
    authed();
    mockSpecialtyCount.mockResolvedValue(2);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/specialties/specialty-1", {
        method: "DELETE",
      }),
      { params: { id: "specialty-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 for a specialty the member does not own", async () => {
    authed();
    mockSpecialtyFindFirst.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/specialties/specialty-1", {
        method: "DELETE",
      }),
      { params: { id: "specialty-1" } }
    );

    expect(res.status).toBe(404);
    expect(mockSpecialtyDelete).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/v1/profiles/me/specialties/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the headline and validated attributes", async () => {
    authed();
    mockSpecialtyUpdate.mockResolvedValue({ id: "specialty-1", headline: "24/7" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me/specialties/specialty-1", {
        method: "PATCH",
        body: JSON.stringify({ headline: "24/7", attributes: { emergency_24_7: true } }),
      }),
      { params: { id: "specialty-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockSpecialtyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "specialty-1" },
        data: expect.objectContaining({ headline: "24/7" }),
      })
    );
  });
});
