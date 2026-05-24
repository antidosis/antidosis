import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";

interface ApiContext {
  requestId: string;
  startTime: number;
}

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type ApiHandler = (
  req: NextRequest,
  ctx: ApiContext,
  ...args: unknown[]
) => Promise<Response>;

/**
 * Wraps an API route handler with structured logging, error handling,
 * request timing, and request ID propagation.
 *
 * Preserves Next.js route params by forwarding all arguments.
 *
 * Usage:
 *   export const GET = withApiHandler(async (req, ctx, { params }) => { ... });
 */
export function withApiHandler(
  handler: ApiHandler
): (req: NextRequest, ...args: unknown[]) => Promise<Response> {
  return async (req: NextRequest, ...args: unknown[]) => {
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
      const response = await handler(req, { requestId, startTime }, ...args);
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

      return response;
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
