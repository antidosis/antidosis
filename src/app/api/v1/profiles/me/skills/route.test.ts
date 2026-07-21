import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST, DELETE } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockSkillFindFirst = vi.fn();
const mockSkillCreate = vi.fn();
const mockSkillDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    skill: {
      findFirst: (...args: unknown[]) => mockSkillFindFirst(...args),
      create: (...args: unknown[]) => mockSkillCreate(...args),
      delete: (...args: unknown[]) => mockSkillDelete(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
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

describe("POST /api/v1/profiles/me/skills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/skills", {
        method: "POST",
        body: JSON.stringify({ name: "React" }),
      })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/skills", {
        method: "POST",
        body: JSON.stringify({ name: "React" }),
      })
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns 400 when skill name is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/skills", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Skill name is required");
  });

  it("returns 409 when skill already exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockSkillFindFirst.mockResolvedValue({ id: "skill-1" });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/skills", {
        method: "POST",
        body: JSON.stringify({ name: "React" }),
      })
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("Skill already exists");
  });

  it("returns 200 on successful skill creation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockSkillFindFirst.mockResolvedValue(null);
    mockSkillCreate.mockResolvedValue({ id: "skill-1", name: "React" });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles/me/skills", {
        method: "POST",
        body: JSON.stringify({ name: "React" }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skill.name).toBe("React");
    expect(mockSkillCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { profileId: "prof-1", name: "React" } })
    );
  });
});

describe("DELETE /api/v1/profiles/me/skills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/skills?name=React", { method: "DELETE" })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/skills?name=React", { method: "DELETE" })
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns 400 when skill name query param is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/skills", { method: "DELETE" })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Skill name is required");
  });

  it("returns 404 when skill not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockSkillFindFirst.mockResolvedValue(null);
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/skills?name=React", { method: "DELETE" })
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Skill not found");
  });

  it("returns 200 on successful skill deletion", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockSkillFindFirst.mockResolvedValue({ id: "skill-1" });
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me/skills?name=React", { method: "DELETE" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSkillDelete).toHaveBeenCalledWith({ where: { id: "skill-1" } });
  });
});
