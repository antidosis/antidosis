import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { resolveEntityId } from "@/lib/resolve-id";
import { sanitizePlainText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

const RESPONSE_MAX = 4000;

type RouteContext = { params: { id: string } };

/**
 * Admin reply to a support ticket. The response is visible to the member in
 * their Support & Report tab and flips the ticket to resolved.
 */
export const PATCH = withApiHandler(async (req: NextRequest, _ctx, { params }: RouteContext) => {
  const admin = await requireAdmin();
  if (!admin.authorized) return admin.response;

  const id = await resolveEntityId("supportRequest", params.id);
  if (!id) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { response, status } = (body ?? {}) as { response?: unknown; status?: unknown };

  const data: { response?: string | null; respondedAt?: Date | null; status?: string } = {};
  if (response !== undefined) {
    if (response !== null && (typeof response !== "string" || response.trim().length === 0)) {
      return NextResponse.json({ error: "Response must be text" }, { status: 400 });
    }
    data.response = response ? sanitizePlainText(response.trim()).slice(0, RESPONSE_MAX) : null;
    data.respondedAt = response ? new Date() : null;
    if (response) data.status = "resolved";
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !["open", "in_progress", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const existing = await prisma.supportRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const request = await prisma.supportRequest.update({
    where: { id },
    data,
    include: {
      profile: { select: { id: true, fullName: true, email: true, handle: true } },
    },
  });

  return NextResponse.json({ request });
});
