import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require email verification
const PROTECTED_ROUTES = [
  "/needs/new",
  "/dashboard",
  "/contracts",
  "/profile",
];

// API routes that require email verification
const PROTECTED_API_PREFIXES = [
  "/api/v1/acceptances",
  "/api/v1/messages",
  "/api/v1/upload",
  "/api/v1/contracts",
  "/api/v1/reviews",
  "/api/v1/profiles/me",
  "/api/v1/billing",
  "/api/v1/pro",
];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Check if this is a protected route
  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtectedPage && !isProtectedApi) {
    return response;
  }

  // Not logged in
  if (!user) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check email verification
  if (!user.email_confirmed_at) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(
      new URL("/verify-email", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
