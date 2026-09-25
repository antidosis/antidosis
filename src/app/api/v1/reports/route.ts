import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { createReportSchema } from "@/lib/schemas/report";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) {
    return participation.response;
  }

  const identifier = getRateLimitIdentifier(req, user.id);
  const limit = await rateLimit(
    identifier,
    { windowMs: 60 * 60 * 1000, maxRequests: 10 },
    "reports-post"
  );

  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { targetType, targetId, reason, details } = parsed.data;

  if (targetType === "profile" && targetId === participation.profileId) {
    return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
  }

  const report = await prisma.report.upsert({
    where: {
      reporterId_targetType_targetId: {
        reporterId: participation.profileId,
        targetType,
        targetId,
      },
    },
    create: {
      reporterId: participation.profileId,
      targetType,
      targetId,
      reason,
      details: details ? sanitizePlainText(details) : null,
    },
    update: {
      reason,
      details: details ? sanitizePlainText(details) : null,
      status: "open",
    },
  });

  return NextResponse.json({ report: { id: report.id, status: report.status } }, { status: 201 });
});
