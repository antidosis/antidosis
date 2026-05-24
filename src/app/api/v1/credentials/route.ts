import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createCredentialSchema } from "@/lib/schemas";
import { sanitizeUrl } from "@/lib/security/url";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const credentials = await prisma.credential.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    logger.error("List credentials error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createCredentialSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const credential = await prisma.credential.create({
      data: {
        profileId: profile.id,
        type: data.type,
        subType: data.subType,
        title: data.title,
        description: data.description,
        documentNumber: data.documentNumber,
        issuedBy: data.issuedBy,
        issuedAt:
          data.issuedAt && !isNaN(new Date(data.issuedAt).getTime())
            ? new Date(data.issuedAt)
            : null,
        expiresAt:
          data.expiresAt && !isNaN(new Date(data.expiresAt).getTime())
            ? new Date(data.expiresAt)
            : null,
        fileUrl: data.fileUrl ? sanitizeUrl(data.fileUrl) : null,
        backFileUrl: data.backFileUrl ? sanitizeUrl(data.backFileUrl) : null,
        isPublic: data.isPublic,
      },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CREDENTIAL_CREATED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      metadata: { credentialId: credential.id, type: credential.type },
    });

    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Create credential error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
