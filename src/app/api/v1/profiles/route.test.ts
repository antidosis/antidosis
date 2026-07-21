import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockGetUser, makeRequest, makeAuthUser, setupApiMocks, TEST_USER_ID } from "@/test/utils";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      create: (...args: unknown[]) => mockProfileCreate(...args),
    },
  },
}));

// ─── Supabase mocks ───
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Mobile mocks ───
const mockNormalizeMobile = vi.fn();
const mockIsValidAustralianMobile = vi.fn();

vi.mock("@/lib/mobile", () => ({
  normalizeMobile: (input: string) => mockNormalizeMobile(input),
  isValidAustralianMobile: (input: string) => mockIsValidAustralianMobile(input),
}));

describe("POST /api/v1/profiles", () => {
  beforeEach(() => {
    setupApiMocks();
    mockNormalizeMobile.mockImplementation((input: string) => input);
    mockIsValidAustralianMobile.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ id: TEST_USER_ID }) },
      error: null,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: TEST_USER_ID, email: "test@example.com" }),
      })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Authentication required");
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "not-a-uuid", email: "bad-email" }),
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 403 when user ID mismatch", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
          email: "test@example.com",
        }),
      })
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("returns 200 when profile already exists", async () => {
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1", userId: TEST_USER_ID });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: TEST_USER_ID, email: "test@example.com" }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("prof-1");
  });

  it("returns 400 for invalid mobile", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    mockNormalizeMobile.mockReturnValue("123");
    mockIsValidAustralianMobile.mockReturnValue(false);
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: TEST_USER_ID, email: "test@example.com", mobile: "123" }),
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid mobile number");
  });

  it("returns 409 when mobile already in use", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "prof-2" });
    mockNormalizeMobile.mockReturnValue("+61400123456");
    mockIsValidAustralianMobile.mockReturnValue(true);
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          email: "test@example.com",
          mobile: "0400123456",
        }),
      })
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already in use");
  });

  it("returns 201 on successful creation", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    mockProfileCreate.mockResolvedValue({
      id: "prof-1",
      userId: TEST_USER_ID,
      email: "test@example.com",
    });
    const res = await POST(
      makeRequest("http://localhost/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: TEST_USER_ID, email: "test@example.com", fullName: "Test" }),
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("prof-1");
    expect(mockProfileCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: TEST_USER_ID,
          email: "test@example.com",
          fullName: "Test",
        }),
      })
    );
  });
});
