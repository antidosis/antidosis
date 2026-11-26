import { type MetadataRoute } from "next";

import { blogPosts } from "@/lib/blog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATIC_LAST_MODIFIED = "2026-11-24";

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/exchange", changeFrequency: "hourly", priority: 0.9 },
  { path: "/pros", changeFrequency: "daily", priority: 0.7 },
  { path: "/examples", changeFrequency: "monthly", priority: 0.7 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/store", changeFrequency: "weekly", priority: 0.7 },
  { path: "/demo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/demo/user-experience", changeFrequency: "yearly", priority: 0.5 },
  { path: "/demo/terminal", changeFrequency: "yearly", priority: 0.5 },
  { path: "/demo/contract-flow", changeFrequency: "yearly", priority: 0.5 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/safety", changeFrequency: "monthly", priority: 0.7 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/register", changeFrequency: "yearly", priority: 0.3 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://antidosis.com").replace(/\/$/, "");
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  try {
    const [needs, profiles] = await Promise.all([
      prisma.need.findMany({
        where: { status: "open" },
        select: { id: true, updatedAt: true },
        take: 1000,
      }),
      prisma.profile.findMany({
        where: { isVerified: true, mobileVerified: true, showInDirectory: true, bannedAt: null },
        select: { id: true, updatedAt: true },
        take: 1000,
      }),
    ]);

    return [
      ...staticRoutes,
      ...needs.map((need) => ({
        url: `${baseUrl}/needs/${need.id}`,
        lastModified: need.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...profiles.map((profile) => ({
        url: `${baseUrl}/profile/${profile.id}`,
        lastModified: profile.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...blogRoutes,
    ];
  } catch {
    return [...staticRoutes, ...blogRoutes];
  }
}
