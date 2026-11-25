import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./[id]/route";
import { GET } from "./route";

const mockSupportFindMany = vi.fn();
const mockSupportFindUnique = vi.fn();
const mockSupportUpdate = vi.fn();
const mockIsAdmin = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supportRequest: {
      findMany: (...args: unknown[]) => mockSupportFindMany(...args),
      findUnique: (...args: unknown[]) => mockSupportFindUnique(...args),
      update: (...args: unknown[]) => mockSupportUpdate(...args),
    },
  },
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => mockIsAdmin(email),
  requireAdmin: () =>
    mockIsAdmin()
      ? { authorized: true }
      : { authorized: false, response: new Response("Forbidden", { status: 403 }) },
}));

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as NextRequest;
}

const TICKET = {
  id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  reference: "SUP-7K2Q9X1W",
  subject: "technical_issue",
  message: "Broken thing",
  status: "open",
  response: null,
  respondedAt: null,
  createdAt: new Date(),
  profile: { id: "p1", fullName: "Member", email: "m@example.com", handle: "member" },
};

describe("admin support queue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET rejects non-admins", async () => {
    mockIsAdmin.mockReturnValue(false);
    const res = await GET(makeRequest("http://localhost/api/v1/admin/support"));
    expect(res.status).toBe(403);
  });

  it("GET lists tickets with member context for admins", async () => {
    mockIsAdmin.mockReturnValue(true);
    mockSupportFindMany.mockResolvedValue([TICKET]);
    const res = await GET(makeRequest("http://localhost/api/v1/admin/support?status=open"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.requests).toHaveLength(1);
    expect(mockSupportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "open" } })
    );
  });

  it("PATCH rejects non-admins", async () => {
    mockIsAdmin.mockReturnValue(false);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/support/x", {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: { id: TICKET.id } }
    );
    expect(res.status).toBe(403);
  });

  it("PATCH stores a reply, stamps respondedAt and resolves", async () => {
    mockIsAdmin.mockReturnValue(true);
    mockSupportFindUnique.mockResolvedValue(TICKET);
    mockSupportUpdate.mockResolvedValue({ ...TICKET, status: "resolved", response: "Fixed!" });
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/support/x", {
        method: "PATCH",
        body: JSON.stringify({ response: "Fixed! Try again now." }),
      }),
      { params: { id: TICKET.id } }
    );
    expect(res.status).toBe(200);
    expect(mockSupportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TICKET.id },
        data: expect.objectContaining({ status: "resolved", response: "Fixed! Try again now." }),
      })
    );
    expect(mockSupportUpdate.mock.calls[0][0].data.respondedAt).toBeInstanceOf(Date);
  });

  it("PATCH validates status values", async () => {
    mockIsAdmin.mockReturnValue(true);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/admin/support/x", {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted" }),
      }),
      { params: { id: TICKET.id } }
    );
    expect(res.status).toBe(400);
    expect(mockSupportUpdate).not.toHaveBeenCalled();
  });
});
