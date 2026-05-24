import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createCredentialSignedUrls } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

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
});
