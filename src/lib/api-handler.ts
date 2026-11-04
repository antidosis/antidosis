import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";

interface ApiContext {
  requestId: string;
  startTime: number;
}

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type ApiHandler<TArgs extends unknown[] = unknown[]> = (
  req: NextRequest,
  ctx: ApiContext,
  ...args: TArgs
) => Promise<Response>;

/**
 * Next.js 15+ delivers route `params`/`searchParams` as Promises. Await them
 * here so individual handlers keep receiving plain resolved objects — one
 * adaptation point instead of touching every route.
 */
async function resolveRouteArgs(args: unknown[]): Promise<unknown[]> {
  return Promise.all(
    args.map(async (arg) => {
      if (!arg || typeof arg !== "object") return arg;
      const ctx = arg as Record<string, unknown>;
      const out: Record<string, unknown> = { ...ctx };
      let changed = false;
      for (const key of ["params", "searchParams"]) {
        const value = ctx[key];
        if (value && typeof (value as Promise<unknown>).then === "function") {
          out[key] = await value;
          changed = true;
        }
      }
      return changed ? out : arg;
    })
  );
}

/**
 * Wraps an API route handler with structured logging, error handling,
 * request timing, and request ID propagation.
 *
 * Preserves Next.js route params by forwarding all arguments.
 *
 * Usage:
 *   export const GET = withApiHandler(async (req, ctx, { params }) => { ... });
 */
export function withApiHandler<TArgs extends unknown[]>(
  handler: ApiHandler<TArgs>
  // The returned function is intentionally typed with `any[]` rest args: Next.js
  // validates exported handlers against `{ params: Promise<...> }` context types,
  // while our handlers keep receiving resolved (plain) objects.
): (req: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (req: NextRequest, ...args: any[]) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;

    logger.info("API request started", {
      requestId,
      method,
      path,
    });

    try {
      const resolvedArgs = await resolveRouteArgs(args);
      const response = await (handler as any)(req, { requestId, startTime }, ...resolvedArgs);
      const latencyMs = Date.now() - startTime;
      const status = response.status;

      logger.info("API request completed", {
        requestId,
        method,
        path,
        status,
        latencyMs,
      });

      // Inject request ID header into response
      if (response instanceof NextResponse) {
        response.headers.set("x-request-id", requestId);
      }

      return response as NextResponse;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error("API request failed", err, {
        requestId,
        method,
        path,
        latencyMs,
      });

      return NextResponse.json(
        {
          error: "Internal server error",
          requestId,
        },
        {
          status: 500,
          headers: {
            "x-request-id": requestId,
          },
        }
      );
    }
  };
}
