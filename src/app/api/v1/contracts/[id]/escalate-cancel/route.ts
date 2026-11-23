import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { contractTitle } from "@/lib/direct-contract";
import { createNotification } from "@/lib/notifications";
import { requireActiveAccount } from "@/lib/participation";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const active = await requireActiveAccount(user.id);
    if (!active.ok) return active.response;

    const limit = await rateLimit(
      getRateLimitIdentifier(req, user.id),
      {
        windowMs: 60 * 60_000,
        maxRequests: 5,
      },
      "contract-escalate-cancel"
    );
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        need: { select: { title: true } },
        partyA: { select: { id: true, fullName: true, email: true } },
        partyB: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const isPartyA = contract.partyAId === profile.id;
    const isPartyB = contract.partyBId === profile.id;

    if (!isPartyA && !isPartyB) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!contract.partyB) {
      return NextResponse.json({ error: "The invited party has not joined" }, { status: 409 });
    }

    // Escalation is the requester's remedy after a decline — only they can escalate,
    // and only while the contract is still in a cancellable stage.
    if (contract.cancelRequestedById !== profile.id) {
      return NextResponse.json(
        { error: "Only the party who requested cancellation can escalate." },
        { status: 403 }
      );
    }

    if (contract.status !== "pending_terms" && contract.status !== "active") {
      return NextResponse.json(
        { error: "The contract is no longer in a cancellable stage." },
        { status: 400 }
      );
    }

    if (contract.cancelResponse !== "declined") {
      return NextResponse.json(
        {
          error:
            "You can only escalate after the other party has declined your cancellation request.",
        },
        { status: 400 }
      );
    }

    if (contract.cancelEscalatedAt) {
      return NextResponse.json(
        { error: "This cancellation has already been escalated to admin." },
        { status: 400 }
      );
    }

    const updatedContract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        cancelEscalatedAt: new Date(),
      },
    });

    // Notify the other party
    const otherParty = isPartyA ? contract.partyB : contract.partyA;
    await createNotification({
      userId: otherParty.id,
      type: "contract_cancel_escalated",
      title: "Cancellation escalated to admin",
      body: `${isPartyA ? contract.partyA.fullName || "The poster" : contract.partyB.fullName || "The fulfiller"} has escalated the cancellation request for "${contractTitle(contract)}" to an admin for review.`,
      data: { contractId: params.id },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CONTRACT_CANCEL_ESCALATED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: `/api/v1/contracts/${params.id}/escalate-cancel`,
      metadata: { contractId: params.id },
    });

    return NextResponse.json({ contract: updatedContract });
  }
);
