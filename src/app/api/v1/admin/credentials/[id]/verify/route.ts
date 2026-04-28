import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
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
  } catch (error) {
    logger.error("Admin verify credential error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
