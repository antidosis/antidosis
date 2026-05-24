import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { redactCredential } from "@/lib/redaction";

export const GET = withApiHandler(
  async (_req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const credentials = await prisma.credential.findMany({
      where: { profileId: profile.id, isPublic: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        documentNumber: true,
        description: true,
        issuedBy: true,
        issuedAt: true,
        expiresAt: true,
        isVerified: true,
        isPublic: true,
        createdAt: true,
      },
    });

    const redacted = credentials.map(redactCredential);

    return NextResponse.json({ credentials: redacted });
  }
);
