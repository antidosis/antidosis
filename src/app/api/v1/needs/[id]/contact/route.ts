import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { resolveEntityId } from "@/lib/resolve-id";
import { createClient } from "@/lib/supabase/server";
import { URGENT_CONTACT_MIN } from "@/lib/urgency";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const POST = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  const needId = await resolveEntityId("need", params.id);
  if (!needId) return NextResponse.json({ error: "Need not found" }, { status: 404 });

  const [userLimit, needLimit] = await Promise.all([
    rateLimit(
      getRateLimitIdentifier(req, user.id),
      { windowMs: 60 * 60_000, maxRequests: 20 },
      "urgent-contact-user"
    ),
    rateLimit(needId, { windowMs: 60 * 60_000, maxRequests: 40 }, "urgent-contact-need"),
  ]);
  if (!userLimit.allowed || !needLimit.allowed) {
    return NextResponse.json(
      { error: "Too many contact reveals. Please use in-app messaging or try again later." },
      { status: 429 }
    );
  }

  const need = await prisma.need.findUnique({
    where: { id: needId },
    select: {
      id: true,
      posterId: true,
      status: true,
      urgency: true,
      allowUrgentContact: true,
      poster: {
        select: { mobile: true, mobileVerified: true, bannedAt: true },
      },
    },
  });
  if (!need) return NextResponse.json({ error: "Need not found" }, { status: 404 });
  if (
    need.status !== "open" ||
    need.urgency < URGENT_CONTACT_MIN ||
    !need.allowUrgentContact ||
    !need.poster.mobileVerified ||
    !need.poster.mobile ||
    need.poster.bannedAt
  ) {
    return NextResponse.json(
      { error: "Direct phone contact is not available for this need." },
      { status: 404 }
    );
  }

  const { ip, userAgent } = getClientInfo(req);
  await auditLog({
    event: "URGENT_CONTACT_REVEALED",
    userId: user.id,
    email: user.email,
    ip,
    userAgent,
    path: `/api/v1/needs/${need.id}/contact`,
    metadata: { needId: need.id, posterId: need.posterId },
  });

  return NextResponse.json(
    { phone: need.poster.mobile },
    { headers: { "Cache-Control": "private, no-store" } }
  );
});
