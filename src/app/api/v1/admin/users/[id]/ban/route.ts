import { type NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { auditLog, getClientInfo } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const banSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/v1/admin/users/[id]/ban — suspend a profile.
 * A suspended profile cannot participate in exchanges (posting, accepting,
 * messaging), and its mobile number can never be re-verified on any account
 * (enforced in the send-otp route) — so a banned scammer cannot re-enter
 * with a fresh email.
 */
export const POST = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json().catch(() => ({}));
    const parsed = banSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: { id: true, bannedAt: true, userId: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    if (profile.bannedAt) {
      return NextResponse.json({ error: "Profile is already banned" }, { status: 409 });
    }

    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: { bannedAt: new Date(), bannedReason: parsed.data.reason ?? null },
      select: { id: true, fullName: true, bannedAt: true, bannedReason: true },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "USER_BANNED",
      userId: profile.userId,
      ip,
      userAgent,
      path: `/api/v1/admin/users/${params.id}/ban`,
      severity: "warning",
      metadata: { reason: parsed.data.reason ?? null },
    });

    return NextResponse.json({ profile: updated });
  }
);

/** DELETE /api/v1/admin/users/[id]/ban — lift a suspension. */
export const DELETE = withApiHandler(
  async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: { id: true, bannedAt: true, userId: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    if (!profile.bannedAt) {
      return NextResponse.json({ error: "Profile is not banned" }, { status: 409 });
    }

    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: { bannedAt: null, bannedReason: null },
      select: { id: true, fullName: true, bannedAt: true },
    });

    const { ip, userAgent } = getClientInfo(req);
    await auditLog({
      event: "USER_UNBANNED",
      userId: profile.userId,
      ip,
      userAgent,
      path: `/api/v1/admin/users/${params.id}/ban`,
      severity: "info",
      metadata: {},
    });

    return NextResponse.json({ profile: updated });
  }
);
