import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

// Supabase free-tier keep-alive — schedule daily (see vercel.json crons).
// Supabase auto-pauses projects after ~7 days without API activity, which
// takes down auth, realtime and storage (the app DB is on Neon and keeps
// working, so the failure is not obvious).
//
// The ping must reach the project's own auth service: the anon
// /auth/v1/health endpoint is served by the API gateway alone and does NOT
// count toward pause detection — the project paused in Jul 2026 while this
// cron was hitting health daily. The service-role admin users query goes
// through the project's auth server and registers as activity.
export const GET = withApiHandler(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ success: false, status: res.status }, { status: 502 });
  }

  return NextResponse.json({ success: true });
});
