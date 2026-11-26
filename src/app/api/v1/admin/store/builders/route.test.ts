import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./[id]/route";
import { GET } from "./route";

const mockBuilderFindMany = vi.fn();
const mockBuilderFindUnique = vi.fn();
const mockBuilderUpdate = vi.fn();
const mockIsAdmin = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshBuilder: {
      findMany: (...args: unknown[]) => mockBuilderFindMany(...args),
      findUnique: (...args: unknown[]) => mockBuilderFindUnique(...args),
      update: (...args: unknown[]) => mockBuilderUpdate(...args),
    },
  },
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: () =>
    mockIsAdmin()
      ? { authorized: true }
      : { authorized: false, response: new Response("Forbidden", { status: 403 }) },
}));

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as NextRequest;
}

const ctx = { params: { id: "b1" } };
const BUILDER = { id: "b1", businessName: "CoastMesh Works", status: "pending" };

describe("admin mesh builders queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockReturnValue(true);
    mockBuilderFindMany.mockResolvedValue([BUILDER]);
    mockBuilderFindUnique.mockResolvedValue(BUILDER);
    mockBuilderUpdate.mockResolvedValue({ ...BUILDER, status: "approved" });
  });

  it("GET rejects non-admins", async () => {
    mockIsAdmin.mockReturnValue(false);
    const res = await GET(makeRequest("http://localhost/api/v1/admin/store/builders"));
    expect(res.status).toBe(403);
  });

  it("GET defaults to the pending queue", async () => {
    const res = await GET(makeRequest("http://localhost/api/v1/admin/store/builders"));
    expect(res.status).toBe(200);
    expect(mockBuilderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "pending" } })
    );
  });

  it("PATCH approves a builder and stamps the review", async () => {
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/store/builders/b1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      ctx
    );
    expect(res.status).toBe(200);
    expect(mockBuilderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "approved", reviewedAt: expect.any(Date) }),
      })
    );
  });

  it("PATCH rejects invalid statuses", async () => {
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/store/builders/b1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      }),
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("PATCH grants extra product slots without touching status", async () => {
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/store/builders/b1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraSlots: 5 }),
      }),
      ctx
    );
    expect(res.status).toBe(200);
    const data = mockBuilderUpdate.mock.calls[0][0].data;
    expect(data.extraSlots).toBe(5);
    expect(data.status).toBeUndefined();
    expect(data.reviewedAt).toBeUndefined();
  });

  it("PATCH rejects an empty update", async () => {
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/store/builders/b1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("PATCH 404s on unknown builders", async () => {
    mockBuilderFindUnique.mockResolvedValue(null);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/store/builders/nope", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: { id: "nope" } }
    );
    expect(res.status).toBe(404);
  });
});
