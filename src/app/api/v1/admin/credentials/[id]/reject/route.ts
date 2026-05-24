import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    let rejectionReason: string | undefined;
    try {
      const body = await req.json();
      const parsed = z.object({ rejectionReason: z.string().max(500).optional() }).safeParse(body);
      if (parsed.success) {
        rejectionReason = parsed.data.rejectionReason;
      }
    } catch {
      // no body, ignore
    }

    const credential = await prisma.credential.update({
      where: { id: params.id },
      data: {
        isVerified: false,
        rejectionReason: rejectionReason ? sanitizePlainText(rejectionReason) : null,
      },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, userId: true },
        },
      },
    });

    // Do NOT set Profile.isVerified = false — user might have other verified credentials

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CREDENTIAL_UPDATED",
      userId: credential.profile.userId,
      email: credential.profile.email,
      ip,
      userAgent,
      path: `/api/v1/admin/credentials/${params.id}/reject`,
      metadata: {
        credentialId: credential.id,
        profileId: credential.profileId,
        action: "rejected",
        rejectionReason: rejectionReason || null,
        adminUserId: auth.user?.id,
      },
    });

    return NextResponse.json({ credential });
  }
);
