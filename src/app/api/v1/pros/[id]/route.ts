import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getDirectoryProfile } from "@/lib/public-content";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { resolveEntityId } from "@/lib/resolve-id";
import { isBlockedAgent } from "@/lib/security/bots";
import { withCors } from "@/lib/security/cors";

export const dynamic = "force-dynamic";

export const GET = withCors(
  withApiHandler(async (req: NextRequest, _ctx, { params }: { params: { id: string } }) => {
    if (isBlockedAgent(req.headers.get("user-agent"))) {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }
    const budget = await rateLimit(
      getRateLimitIdentifier(req),
      { windowMs: 60_000, maxRequests: 60 },
      "directory-read"
    );
    if (!budget.allowed) {
      return NextResponse.json(
        { error: "Too many requests — slow down" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((budget.resetAt - Date.now()) / 1000)) },
        }
      );
    }

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
