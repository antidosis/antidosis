import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { auditLog, getClientInfo } from "@/lib/audit";

// Routes that require email verification
const PROTECTED_ROUTES = [
  "/needs/new",
  "/dashboard",
  "/contracts",
  "/admin",
  "/verify-mobile",
  "/terminal",
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
  "/api/v1/pro/",
  "/api/v1/credentials",
  "/api/v1/admin",
  "/api/v1/terminal",
];

// API routes that bypass auth entirely
const PUBLIC_API_ROUTES = [
  "/api/v1/billing/webhook",
];

export async function middleware(request: NextRequest) {
  // Redirect www to non-www
  const host = request.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const newUrl = new URL(request.url);
    newUrl.host = host.replace("www.", "");
    return NextResponse.redirect(newUrl, 308);
  }

  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Check if this is a protected route
  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
    pathname === route
  );

  if (isPublicApi) {
    return response;
  }

  if (!isProtectedPage && !isProtectedApi) {
    return response;
  }

  // Not logged in
  if (!user) {
    const { ip, userAgent } = getClientInfo(request);
    // Fire-and-forget: don't block the response on audit logging
    auditLog({
      event: "AUTH_FAILURE",
      ip,
      userAgent,
      path: pathname,
      severity: "warning",
      metadata: { reason: "unauthenticated" },
    }).catch(() => {});

    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check email verification
  if (!user.email_confirmed_at) {
    const { ip, userAgent } = getClientInfo(request);
    // Fire-and-forget: don't block the response on audit logging
    auditLog({
      event: "AUTH_FAILURE",
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      path: pathname,
      severity: "warning",
      metadata: { reason: "email_not_verified" },
    }).catch(() => {});

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
