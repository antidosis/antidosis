import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { createCredentialSignedUrls } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const credentials = await prisma.credential.findMany({
      where: { isVerified: false },
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            mobile: true,
          },
        },
      },
    });

    // Generate signed URLs for each credential's documents
    const credentialsWithSignedUrls = await Promise.all(
      credentials.map(async (c) => {
        const { signedUrl, signedBackUrl } = await createCredentialSignedUrls(c);
        return {
          id: c.id,
          type: c.type,
          subType: c.subType,
          title: c.title,
          description: c.description,
          documentNumber: c.documentNumber,
          issuedBy: c.issuedBy,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
          isPublic: c.isPublic,
          isVerified: c.isVerified,
          createdAt: c.createdAt,
          signedUrl,
          signedBackUrl,
          profile: c.profile,
        };
      })
    );

    return NextResponse.json({ credentials: credentialsWithSignedUrls });
  } catch (error) {
    logger.error("Admin pending credentials error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
