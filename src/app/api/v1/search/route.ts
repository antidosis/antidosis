import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    if (!q || q.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const query = q.toLowerCase();

    const [needs, users, pros] = await Promise.all([
      prisma.need.findMany({
        where: {
          status: "open",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, locationName: true, offerValue: true },
      }),
      prisma.profile.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: {
          id: true,
          fullName: true,
          locationName: true,
          ratingAvg: true,
          ratingCount: true,
        },
      }),
      prisma.profile.findMany({
        where: {
          isPro: true,
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { skills: { some: { name: { contains: query, mode: "insensitive" } } } },
          ],
        },
        take: 10,
        select: {
          id: true,
          fullName: true,
          locationName: true,
          ratingAvg: true,
          ratingCount: true,
        },
      }),
    ]);

    return NextResponse.json({ needs, users, pros });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
