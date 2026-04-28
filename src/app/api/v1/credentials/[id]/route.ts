import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { auditLog, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sanitizeUrl } from "@/lib/security/url";
import { z } from "zod";

const credentialTypes = [
  "license",
  "qualification",
  "certification",
  "ticket",
  "resume",
  "identification",
  "insurance",
  "business_registration",
  "other",
] as const;

const updateSchema = z.object({
  type: z.enum(credentialTypes).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  documentNumber: z.string().max(100).optional(),
  issuedBy: z.string().max(200).optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  fileUrl: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

async function getUserCredential(userId: string, credentialId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  return prisma.credential.findFirst({
    where: { id: credentialId, profileId: profile.id },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credential = await getUserCredential(user.id, params.id);
    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.credential.update({
      where: { id: params.id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.documentNumber !== undefined && { documentNumber: data.documentNumber }),
        ...(data.issuedBy !== undefined && { issuedBy: data.issuedBy }),
        ...(data.issuedAt !== undefined && { issuedAt: data.issuedAt && !isNaN(new Date(data.issuedAt).getTime()) ? new Date(data.issuedAt) : null }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt && !isNaN(new Date(data.expiresAt).getTime()) ? new Date(data.expiresAt) : null }),
        ...(data.fileUrl !== undefined && { fileUrl: sanitizeUrl(data.fileUrl) || data.fileUrl }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CREDENTIAL_UPDATED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      metadata: { credentialId: params.id },
    });

    return NextResponse.json({ credential: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error("Update credential error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credential = await getUserCredential(user.id, params.id);
    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    await prisma.credential.delete({ where: { id: params.id } });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "CREDENTIAL_DELETED",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      metadata: { credentialId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete credential error:", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
