import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileUpdate = vi.fn();
const mockSpecialtyFindMany = vi.fn();
const mockSpecialtyFindFirst = vi.fn();
const mockSpecialtyCreate = vi.fn();
const mockSpecialtyCount = vi.fn();
/** ABN returned when the account-type sync reads the profile — set per test. */
let syncAbn: string | null = "12345678901";
/** Slots the member has unlocked — set per test (1 = free tier). */
let unlockedSlots = 1;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
    directorySpecialty: {
      findMany: (...args: unknown[]) => mockSpecialtyFindMany(...args),
      findFirst: (...args: unknown[]) => mockSpecialtyFindFirst(...args),
      create: (...args: unknown[]) => mockSpecialtyCreate(...args),
      count: (...args: unknown[]) => mockSpecialtyCount(...args),
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
  // requireProfile reads { id, bannedAt, specialtySlotsUnlocked }; the
  // account-type sync reads { accountType, abn } — dispatch on the select shape.
  mockProfileFindUnique.mockImplementation((args: { select?: Record<string, boolean> }) =>
    args?.select?.accountType !== undefined
      ? { accountType: "individual", abn: syncAbn }
      : { id: "profile-1", bannedAt: null, specialtySlotsUnlocked: unlockedSlots }
  );
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
    unlockedSlots = 1;
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

  it("reports how many slots the member has unlocked", async () => {
    unlockedSlots = 3;
    authed();
    mockSpecialtyFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me/specialties"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unlockedSlots).toBe(3);
  });
});

describe("POST /api/v1/profiles/me/specialties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syncAbn = "12345678901";
    unlockedSlots = 1;
    mockSpecialtyCount.mockResolvedValue(1);
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

  it("accepts free-typed custom professions (any skill-style text)", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s1", profession: "rocket_surgeon", slot: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "Rocket Surgeon" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockSpecialtyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profession: "rocket_surgeon" }),
      })
    );
  });

  it("rejects non-string or too-short profession input", async () => {
    authed();

    const tooShort = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "a" }),
      })
    );
    expect(tooShort.status).toBe(400);
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

  it("lets same-industry professions share the free slot", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1, profession: "web_developer" }]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s2", profession: "app_developer", slot: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "app developer" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockSpecialtyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profession: "app_developer", slot: 1 }),
      })
    );
  });

  it("rejects a different industry in the free slot with 409 INDUSTRY_MISMATCH", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1, profession: "plumber" }]);

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "web developer" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe("INDUSTRY_MISMATCH");
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("rejects a fifth profession with 402 SLOT_LOCKED (free slot full, paid unlock not yet live)", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([
      { slot: 1, profession: "plumber" },
      { slot: 1, profession: "electrician" },
      { slot: 1, profession: "carpenter" },
      { slot: 1, profession: "handyman" },
    ]);

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "painter" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.code).toBe("SLOT_LOCKED");
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("rejects a duplicate profession claim", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1, profession: "plumber" }]);

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "plumber" }),
      })
    );
    expect(res.status).toBe(409);
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("allocates a different industry to slot 2 when the member has unlocked it", async () => {
    unlockedSlots = 2;
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1, profession: "plumber" }]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s2", profession: "web_developer", slot: 2 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "web developer" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockSpecialtyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profession: "web_developer", slot: 2 }),
      })
    );
  });

  it("spills a fifth same-industry profession into the next unlocked slot", async () => {
    unlockedSlots = 2;
    authed();
    mockSpecialtyFindMany.mockResolvedValue([
      { slot: 1, profession: "plumber" },
      { slot: 1, profession: "electrician" },
      { slot: 1, profession: "carpenter" },
      { slot: 1, profession: "handyman" },
    ]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s5", profession: "painter", slot: 2 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "painter" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockSpecialtyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profession: "painter", slot: 2 }),
      })
    );
  });

  it("joins the slot already dedicated to the profession's industry", async () => {
    unlockedSlots = 2;
    authed();
    mockSpecialtyFindMany.mockResolvedValue([
      { slot: 1, profession: "plumber" },
      { slot: 2, profession: "web_developer" },
    ]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s3", profession: "electrician", slot: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "electrician" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockSpecialtyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profession: "electrician", slot: 1 }),
      })
    );
  });

  it("keeps slot 2 locked for members on the free tier even when slot 1 has room elsewhere", async () => {
    authed();
    mockSpecialtyFindMany.mockResolvedValue([{ slot: 1, profession: "plumber" }]);

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "web developer" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe("INDUSTRY_MISMATCH");
    expect(mockSpecialtyCreate).not.toHaveBeenCalled();
  });

  it("upgrades the account to business when the first specialty is claimed with an ABN on file", async () => {
    authed();
    syncAbn = "12345678901";
    mockSpecialtyFindMany.mockResolvedValue([]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s1", profession: "plumber", slot: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "plumber" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: { accountType: "business" },
      })
    );
  });

  it("leaves the account type alone when no ABN is on file yet", async () => {
    authed();
    syncAbn = null;
    mockSpecialtyFindMany.mockResolvedValue([]);
    mockSpecialtyCreate.mockResolvedValue({ id: "s1", profession: "plumber", slot: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/specialties", {
        method: "POST",
        body: JSON.stringify({ profession: "plumber" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
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
