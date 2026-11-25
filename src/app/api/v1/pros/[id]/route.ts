import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getDirectoryProfile } from "@/lib/public-content";
import { resolveEntityId } from "@/lib/resolve-id";
import { withCors } from "@/lib/security/cors";

export const dynamic = "force-dynamic";

export const GET = withCors(
  withApiHandler(async (_req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    const id = await resolveEntityId("profile", params.id);
    if (!id) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const listing = await getDirectoryProfile(id);
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    return NextResponse.json(listing, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  })
);
