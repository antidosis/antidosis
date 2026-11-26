import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { logContractEvent } from "@/lib/contract-events";
import { hashInviteToken } from "@/lib/invite-token";
import { createNotification } from "@/lib/notifications";
import { requireVerifiedParticipation } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

function validToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,64}$/.test(token);
}

export const GET = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { token: string } }) => {
    if (!validToken(params.token)) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const contract = await prisma.contract.findUnique({
      where: { inviteTokenHash: hashInviteToken(params.token) },
      select: {
        id: true,
        kind: true,
        title: true,
        status: true,
        inviteExpiresAt: true,
        partyBId: true,
        partyA: { select: { fullName: true, avatarUrl: true } },
      },
    });

    if (
      !contract ||
      contract.kind !== "direct" ||
      contract.partyBId ||
      contract.status === "cancelled" ||
      !contract.inviteExpiresAt ||
      contract.inviteExpiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: "Invitation is invalid, used or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        invitation: {
          title: contract.title,
          inviter: contract.partyA,
          expiresAt: contract.inviteExpiresAt,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
);

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { token: string } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Verify your email before accepting this agreement", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }
    if (!validToken(params.token)) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const participation = await requireVerifiedParticipation(user.id);
    if (!participation.ok) return participation.response;

    const limit = await rateLimit(
      getRateLimitIdentifier(req, user.id),
      { windowMs: 60 * 60_000, maxRequests: 10 },
      "direct-contract-claim"
    );
    if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const hash = hashInviteToken(params.token);
    const contract = await prisma.contract.findUnique({
      where: { inviteTokenHash: hash },
      select: {
        id: true,
        kind: true,
        title: true,
        status: true,
        partyAId: true,
        partyBId: true,
        inviteEmail: true,
        inviteExpiresAt: true,
      },
    });

    if (
      !contract ||
      contract.kind !== "direct" ||
      contract.partyBId ||
      contract.status !== "draft" ||
      !contract.inviteExpiresAt ||
      contract.inviteExpiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: "Invitation is invalid, used or expired" },
        { status: 410 }
      );
    }
    if (contract.partyAId === participation.profileId) {
      return NextResponse.json({ error: "You cannot accept your own invitation" }, { status: 400 });
    }
    if (contract.inviteEmail && contract.inviteEmail !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was addressed to a different email account" },
        { status: 403 }
      );
    }

    const claimed = await prisma.contract.updateMany({
      where: { id: contract.id, partyBId: null, inviteTokenHash: hash, status: "draft" },
      data: {
        partyBId: participation.profileId,
        claimedAt: new Date(),
        inviteTokenHash: null,
        inviteEmail: null,
      },
    });
    if (claimed.count !== 1) {
      return NextResponse.json({ error: "Invitation has already been used" }, { status: 409 });
    }

    await createNotification({
      userId: contract.partyAId,
      type: "direct_contract_claimed",
      title: "Direct agreement accepted",
      body: `Your invitation for "${contract.title}" has been accepted. You can now review and finalise the terms together.`,
      data: { contractId: contract.id },
    }).catch(() => undefined);

    await logContractEvent({
      contractId: contract.id,
      actorId: participation.profileId,
      action: "invite_claimed",
      detail: { inviteEmail: contract.inviteEmail ?? null },
      statusBefore: "draft",
      statusAfter: "draft",
    });

    return NextResponse.json({ contractId: contract.id });
  }
);
