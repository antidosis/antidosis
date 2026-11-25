import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getDirectoryProfiles } from "@/lib/public-content";
import { withCors } from "@/lib/security/cors";

export const GET = withCors(
  withApiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const profiles = await getDirectoryProfiles(
      searchParams.get("q")?.slice(0, 100),
      searchParams.get("type") ?? undefined,
      searchParams.get("profession") ?? undefined
    );

    return NextResponse.json(profiles, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  })
);
