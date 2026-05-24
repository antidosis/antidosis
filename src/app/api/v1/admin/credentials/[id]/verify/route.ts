import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const credential = await prisma.credential.update({
      where: { id: params.id },
      data: { isVerified: true },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, userId: true },
        },
      },
    });

    // Also mark the profile as verified
    await prisma.profile.update({
      where: { id: credential.profileId },
      data: { isVerified: true },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CREDENTIAL_UPDATED",
      userId: credential.profile.userId,
      email: credential.profile.email,
      ip,
      userAgent,
      path: `/api/v1/admin/credentials/${params.id}/verify`,
      metadata: {
        credentialId: credential.id,
        profileId: credential.profileId,
        action: "verified",
        adminUserId: auth.user?.id,
      },
    });

    return NextResponse.json({ credential });
  }
);
