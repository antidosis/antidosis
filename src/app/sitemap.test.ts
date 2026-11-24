import { beforeEach, describe, expect, it, vi } from "vitest";

import { blogPosts } from "@/lib/blog";

const { findNeeds, findProfiles } = vi.hoisted(() => ({
  findNeeds: vi.fn(),
  findProfiles: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: { findMany: findNeeds },
    profile: { findMany: findProfiles },
  },
}));

import sitemap from "./sitemap";

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findNeeds.mockResolvedValue([{ id: "need-live", updatedAt: new Date("2026-11-20") }]);
    findProfiles.mockResolvedValue([{ id: "profile-live", updatedAt: new Date("2026-11-21") }]);
  });

  it("generates current content URLs from their source records", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://antidosis.com/examples");
    expect(urls).toContain("https://antidosis.com/exchange");
    expect(urls).toContain("https://antidosis.com/store");
    expect(urls).toContain("https://antidosis.com/store/interest");
    expect(urls).toContain("https://antidosis.com/store/builders");
    expect(urls).toContain("https://antidosis.com/needs/need-live");
    expect(urls).toContain("https://antidosis.com/profile/profile-live");
    expect(urls).not.toContain("https://antidosis.com/needs");
    expect(urls).not.toContain("https://antidosis.com/needs/new");
    expect(urls).not.toContain("https://antidosis.com/terminal");
    expect(new Set(urls).size).toBe(urls.length);

    for (const post of blogPosts) {
      const entry = entries.find((item) => item.url.endsWith(`/blog/${post.slug}`));
      expect(entry).toBeDefined();
      expect(entry?.lastModified).toBe(post.updatedAt ?? post.publishedAt);
    }
  });

  it("only exposes opted-in, non-banned directory profiles", async () => {
    await sitemap();
    expect(findProfiles).toHaveBeenCalledWith({
      where: { isVerified: true, mobileVerified: true, showInDirectory: true, bannedAt: null },
      select: { id: true, updatedAt: true },
      take: 1000,
    });
  });

  it("keeps valid static and blog URLs when the database is unavailable", async () => {
    findNeeds.mockRejectedValue(new Error("offline"));
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://antidosis.com/");
    expect(urls).toContain("https://antidosis.com/examples");
    expect(urls).toHaveLength(17 + blogPosts.length);
    expect(urls.some((url) => url.includes("/needs/need-live"))).toBe(false);
  });
});
