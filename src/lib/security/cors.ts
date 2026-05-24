import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "capacitor://localhost",
  "https://localhost",
  "https://antidosis.vercel.app",
  "https://antidosis.com",
  "https://www.antidosis.com",
  "https://antidosis-kqs9nele2-martins-projects-5d68d645.vercel.app",
];

export function withCors(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest) => {
    const origin = req.headers.get("origin");
    const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": isAllowed ? origin || "*" : "",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const res = await handler(req);

    if (isAllowed && origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
    }
    res.headers.set("Access-Control-Allow-Credentials", "true");

    return res;
  };
}
