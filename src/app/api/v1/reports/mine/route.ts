import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The signed-in member's own trust-and-safety reports with status — lets them
 * follow what happened after they reported a need, profile or message.
 */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const reports = await prisma.report.findMany({
    where: { reporterId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Resolve targets to human-readable labels where the target still exists.
  const needIds = reports
    .filter((report) => report.targetType === "need")
    .map((report) => report.targetId);
  const profileIds = reports
    .filter((report) => report.targetType === "profile")
    .map((report) => report.targetId);

  const [needs, profiles] = await Promise.all([
    needIds.length
      ? prisma.need.findMany({ where: { id: { in: needIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    profileIds.length
      ? prisma.profile.findMany({
          where: { id: { in: profileIds } },
          select: { id: true, fullName: true, handle: true },
        })
      : Promise.resolve([]),
  ]);

  const needTitles = new Map(needs.map((need) => [need.id, need.title]));
  const profileNames = new Map(
    profiles.map((target) => [target.id, target.fullName || target.handle || "A member"])
  );

  const enriched = reports.map((report) => ({
    ...report,
    targetLabel:
      report.targetType === "need"
        ? (needTitles.get(report.targetId) ?? "Deleted need")
        : report.targetType === "profile"
          ? (profileNames.get(report.targetId) ?? "Deleted profile")
          : "A message",
  }));

  return NextResponse.json({ reports: enriched });
});
