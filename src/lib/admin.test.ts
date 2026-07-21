import { describe, it, expect, vi, beforeEach } from "vitest";

import { requireAdmin, isAdminEmail } from "./admin";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com, super@antidosis.com";
  });

  it("returns unauthorized when no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
    expect(result.response!.status).toBe(401);
  });

  it("returns forbidden when user is not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "user@example.com" } },
      error: null,
    });
    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
    expect(result.response!.status).toBe(403);
  });

  it("returns authorized for admin email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@example.com" } },
      error: null,
    });
    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
    expect(result.user).toBeDefined();
  });

  it("handles uppercase admin email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "ADMIN@EXAMPLE.COM" } },
      error: null,
    });
    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
  });

  it("handles empty ADMIN_EMAILS env", async () => {
    process.env.ADMIN_EMAILS = "";
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@example.com" } },
      error: null,
    });
    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
  });
});

describe("isAdminEmail", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@example.com";
  });

  it("returns true for admin email", () => {
    expect(isAdminEmail("admin@example.com")).toBe(true);
  });

  it("returns true for uppercase admin email", () => {
    expect(isAdminEmail("ADMIN@EXAMPLE.COM")).toBe(true);
  });

  it("returns false for non-admin email", () => {
    expect(isAdminEmail("user@example.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is empty", () => {
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("admin@example.com")).toBe(false);
  });
});
