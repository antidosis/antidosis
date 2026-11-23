import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "./route";

const mockGetUser = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockNotificationFindFirst = vi.fn();
const mockNotificationUpdate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    notification: {
      findFirst: (...args: unknown[]) => mockNotificationFindFirst(...args),
      update: (...args: unknown[]) => mockNotificationUpdate(...args),
    },
  },
}));

function request() {
  return new Request("http://localhost/api/v1/notifications/n1/archive") as NextRequest;
}

function params() {
  return { params: { id: "n1" } };
}

describe("notification archive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNotificationFindFirst.mockResolvedValue({ id: "n1" });
    mockNotificationUpdate.mockResolvedValue({ id: "n1" });
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await PATCH(request(), params());
    expect(response.status).toBe(401);
    expect(mockNotificationUpdate).not.toHaveBeenCalled();
  });

  it("only archives a notification owned by the current profile", async () => {
    const response = await PATCH(request(), params());
    expect(response.status).toBe(200);
    expect(mockNotificationFindFirst).toHaveBeenCalledWith({
      where: { id: "n1", userId: "profile-1" },
      select: { id: true },
    });
    expect(mockNotificationUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { archivedAt: expect.any(Date) },
    });
  });

  it("does not reveal whether another member owns the notification", async () => {
    mockNotificationFindFirst.mockResolvedValue(null);
    const response = await PATCH(request(), params());
    expect(response.status).toBe(404);
    expect(mockNotificationUpdate).not.toHaveBeenCalled();
  });

  it("restores an owned notification to the inbox", async () => {
    const response = await DELETE(request(), params());
    expect(response.status).toBe(200);
    expect(mockNotificationUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { archivedAt: null },
    });
  });
});
