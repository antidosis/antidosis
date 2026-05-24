import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const START_TIME = Date.now();

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latencyMs: number; message?: string }> =
    {};
  let overall = "ok" as "ok" | "error";

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (err) {
    overall = "error";
    checks.database = {
      status: "error",
      latencyMs: Date.now() - dbStart,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Supabase check
  const sbStart = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    checks.supabase = { status: "ok", latencyMs: Date.now() - sbStart };
  } catch (err) {
    overall = "error";
    checks.supabase = {
      status: "error",
      latencyMs: Date.now() - sbStart,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  const response = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
    checks,
  };

  if (overall === "error") {
    logger.error("Health check failed", undefined, { checks, uptimeSeconds });
  }

  return NextResponse.json(response, {
    status: overall === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
