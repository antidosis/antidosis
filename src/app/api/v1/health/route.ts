import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "antidosis-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}
