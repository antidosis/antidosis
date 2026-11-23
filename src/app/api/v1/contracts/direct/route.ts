import { type NextRequest, NextResponse } from "next/server";

import { randomBytes } from "node:crypto";

import { withApiHandler } from "@/lib/api-handler";
import { hashInviteToken } from "@/lib/invite-token";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { createDirectContractSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  const participation = await requireVerifiedParticipation(user.id);
  if (!participation.ok) return participation.response;

  const limit = await rateLimit(
    getRateLimitIdentifier(req, user.id),
    { windowMs: 60 * 60_000, maxRequests: 10 },
    "direct-contract-create"
  );
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const parsed = createDirectContractSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the title, description and terms", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const contract = await prisma.contract.create({
    data: {
      kind: "direct",
      title: parsed.data.title,
      description: parsed.data.description,
      terms: JSON.stringify({ customTerms: parsed.data.terms }),
      partyATerms: parsed.data.terms,
      negotiationMessages: [],
      considerationType: parsed.data.paymentAmount != null ? "money" : "direct",
      considerationValue: parsed.data.paymentAmount ?? null,
      partyAId: participation.profileId,
      inviteEmail: parsed.data.inviteEmail?.toLowerCase() ?? null,
      inviteTokenHash: hashInviteToken(token),
      invitedAt: now,
      inviteExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: "draft",
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  return NextResponse.json(
    { contract, inviteUrl: `${origin}/contracts/join/${token}` },
    { status: 201 }
  );
});
