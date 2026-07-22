import { describe, it, expect, vi, beforeEach } from "vitest";

import { isUuid, isIdPrefixLike, resolveEntityId } from "./resolve-id";

const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

const UUID = "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("isUuid / isIdPrefixLike", () => {
  it("recognises full UUIDs", () => {
    expect(isUuid(UUID)).toBe(true);
    expect(isUuid("b1b2c3d4")).toBe(false);
  });

  it("recognises hex prefixes, not garbage", () => {
    expect(isIdPrefixLike("b1b2c3d4")).toBe(true);
    expect(isIdPrefixLike("not-a-uuid")).toBe(false);
    expect(isIdPrefixLike("zzz")).toBe(false);
  });
});

describe("resolveEntityId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes full UUIDs through without hitting the database", async () => {
    const result = await resolveEntityId("need", UUID);
    expect(result).toBe(UUID);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("resolves a unique prefix to the full id", async () => {
    mockFindMany.mockResolvedValue([{ id: UUID }]);

    const result = await resolveEntityId("need", "b1b2c3d4");

    expect(result).toBe(UUID);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { id: { startsWith: "b1b2c3d4" } },
      select: { id: true },
      take: 2,
    });
  });

  it("returns null when nothing matches", async () => {
    mockFindMany.mockResolvedValue([]);
    expect(await resolveEntityId("need", "b1b2c3d4")).toBeNull();
  });

  it("returns null when the prefix is ambiguous", async () => {
    mockFindMany.mockResolvedValue([{ id: UUID }, { id: "b1b2c3d4-0000-4000-8000-000000000000" }]);
    expect(await resolveEntityId("need", "b1b2c3d4")).toBeNull();
  });

  it("returns null for malformed input without a DB call", async () => {
    expect(await resolveEntityId("need", "not-an-id")).toBeNull();
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
