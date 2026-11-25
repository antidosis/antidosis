import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockSpecialtyFindMany = vi.fn();
const mockSpecialtyFindFirst = vi.fn();
const mockSpecialtyCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    directorySpecialty: {
      findMany: (...args: unknown[]) => mockSpecialtyFindMany(...args),
      findFirst: (...args: unknown[]) => mockSpecialtyFindFirst(...args),
      create: (...args: unknown[]) => mockSpecialtyCreate(...args),
    },
  },
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
  mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null });
}

const PLUMBER_ATTRIBUTES = {
  emergency_24_7: true,
  licensed: true,
  services: ["Blocked drains", "Gas fitting"],
  service_area: "Gosford to Wyong",
};

describe("GET /api/v1/profiles/me/specialties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me/specialties"));
    expect(res.status).toBe(401);
  });

  it("lists the member's specialties ordered by slot", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([
      { id: "s1", profession: "plumber", slot: 1, headline: null, attributes: "{}" },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me/specialties"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.specialties).toHaveLength(1);
    expect(mockSpecialtyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profileId: "profile-1" }, orderBy: { slot: "asc" } })
    );
  });
});

describe("POST /api/v1/profiles/me/specialties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims slot 1 with validated profession attributes", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s1", profession: "plumber", slot: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "plumber", attributes: PLUMBER_ATTRIBUTES }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockSpecialtyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileId: "profile-1",
          profession: "plumber",
          slot: 1,
        }),
      })
    );
    const stored = JSON.parse(mockSpecialtyCreate.mock.calls[0][0].data.attributes);
    expect(stored.emergency_24_7).toBe(true);
    expect(stored.services).toEqual(["Blocked drains", "Gas fitting"]);
  });

  it("rejects unknown professions", async () => {
    authed();
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "astronaut" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("drops attribute values outside the profession's options", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s1" });

    await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({
          profession: "plumber",
          attributes: {
            emergency_24_7: "yes-not-a-boolean",
            services: ["Blocked drains", "Rocket surgery"],
            unknown_field: "should-be-dropped",
          },
        }),
      })
    );

    const stored = JSON.parse(mockSpecialtyCreate.mock.calls[0][0].data.attributes);
    expect(stored.emergency_24_7).toBeUndefined();
    expect(stored.services).toEqual(["Blocked drains"]);
    expect(stored.unknown_field).toBeUndefined();
  });

  it("rejects a second specialty with 402 SLOT_LOCKED (paid unlock not yet live)", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1 }]);

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "cleaner" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.code).toBe("SLOT_LOCKED");
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("rejects a duplicate profession claim", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1 }]);
    mockSpecialtyFindFirst.mockResolvedValue({ id: "s1", profession: "plumber" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "plumber" }),
      })
    );
    expect(res.status).toBe(409);
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("rejects members whose account is suspended", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: new Date() });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "plumber" }),
      })
    );
    expect(res.status).toBe(404);
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });
});
