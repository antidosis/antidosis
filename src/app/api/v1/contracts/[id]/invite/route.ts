import { type NextRequest, NextResponse } from "next/server";

import { randomBytes } from "node:crypto";

import { withApiHandler } from "@/lib/api-handler";
import { hashInviteToken } from "@/lib/invite-token";
import { requireActiveAccount } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const active = await requireActiveAccount(user.id);
    if (!active.ok) return active.response;

    const limit = await rateLimit(
      getRateLimitIdentifier(req, user.id),
      { windowMs: 60 * 60_000, maxRequests: 10 },
      "direct-contract-invite"
    );
    if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { id: true, kind: true, partyAId: true, partyBId: true, status: true },
    });
    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    if (contract.partyAId !== active.profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (contract.kind !== "direct" || contract.partyBId || contract.status !== "draft") {
      return NextResponse.json(
        { error: "This agreement can no longer be invited to" },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        inviteTokenHash: hashInviteToken(token),
        invitedAt: now,
        inviteExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    return NextResponse.json({ inviteUrl: `${origin}/contracts/join/${token}` });
  }
);
