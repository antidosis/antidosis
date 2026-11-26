import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FIELD_KEYS = ["phone", "email", "website", "socials"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

/**
 * The listing/profile owner's own reveal analytics: how often their contact
 * details were revealed, split by surface (directory listing vs public
 * profile) and by field. Sourced from the contact_reveals audit table —
 * viewer identities are never exposed, only aggregates.
 */
export const GET = withApiHandler(async (_req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, recent, lastReveal] = await Promise.all([
    prisma.contactReveal.count({ where: { targetId: profile.id } }),
    prisma.contactReveal.findMany({
      where: { targetId: profile.id, createdAt: { gte: thirtyDaysAgo } },
      select: { scope: true, fields: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactReveal.findFirst({
      where: { targetId: profile.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const byScope = { listing: 0, personal: 0 };
  const byField: Record<FieldKey, number> = { phone: 0, email: 0, website: 0, socials: 0 };
  for (const reveal of recent) {
    if (reveal.scope === "listing") byScope.listing += 1;
    else byScope.personal += 1;
    try {
      const fields = JSON.parse(reveal.fields) as unknown;
      if (Array.isArray(fields)) {
        for (const field of fields) {
          if (FIELD_KEYS.includes(field as FieldKey)) byField[field as FieldKey] += 1;
        }
      }
    } catch {
      // malformed audit row — skip field accounting, the reveal still counts
    }
  }

  return NextResponse.json(
    {
      total,
      last30d: recent.length,
      byScope,
      byField,
      lastRevealAt: lastReveal?.createdAt.toISOString() ?? null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
});
