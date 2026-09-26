import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

// Supabase free-tier keep-alive — schedule daily (see vercel.json crons).
// Supabase auto-pauses projects after ~7 days without API activity, which
// takes down auth, realtime and storage (the app DB is on Neon and keeps
// working, so the failure is not obvious). A daily request through the
// project's API gateway registers as activity and prevents the pause.
export const GET = withApiHandler(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: anonKey },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ success: false, status: res.status }, { status: 502 });
  }

  return NextResponse.json({ success: true });
});
