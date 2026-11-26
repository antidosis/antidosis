import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getDirectoryProfiles } from "@/lib/public-content";
import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";
import { isBlockedAgent } from "@/lib/security/bots";
import { withCors } from "@/lib/security/cors";

export const GET = withCors(
  withApiHandler(async (req: NextRequest) => {
    // Directory reads are public but not a bulk-export API: known crawler
    // agents are refused and per-IP budgets blunt mass harvesting.
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

    const { searchParams } = new URL(req.url);
    const profiles = await getDirectoryProfiles(
      searchParams.get("q")?.slice(0, 100),
      searchParams.get("type") ?? undefined,
      searchParams.get("profession") ?? undefined,
      searchParams.get("exchange") ?? undefined
    );

    return NextResponse.json(profiles, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  })
);
