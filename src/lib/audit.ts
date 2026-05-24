import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export type AuditEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "REGISTER"
  | "LOGOUT"
  | "EMAIL_VERIFIED"
  | "EMAIL_RESENT"
  | "NEED_CREATED"
  | "NEED_DELETED"
  | "INTEREST_EXPRESSED"
  | "CONTRACT_SIGNED"
  | "CONTRACT_COMPLETED"
  | "CONTRACT_CANCELLED"
  | "CONTRACT_CANCEL_REQUESTED"
  | "CONTRACT_CANCEL_AGREED"
  | "CONTRACT_CANCEL_DECLINED"
  | "CONTRACT_CANCEL_ESCALATED"
  | "CONTRACT_FORCE_CANCELLED_BY_ADMIN"
  | "REVIEW_SUBMITTED"
  | "PROFILE_UPDATED"
  | "PRO_CLAIMED"
  | "UPLOAD_CREATED"
  | "RATE_LIMIT_HIT"
  | "AUTH_FAILURE"
  | "FORBIDDEN_ACCESS"
  | "SUSPICIOUS_ACTIVITY"
  | "CREDENTIAL_CREATED"
  | "CREDENTIAL_UPDATED"
  | "CREDENTIAL_DELETED";

export type AuditSeverity = "info" | "warning" | "critical";

interface AuditOptions {
  event: AuditEvent;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

/**
 * Fire-and-forget audit log. Writes to DB + console.
 * Never throws — failures are silently logged to console.
 */
export async function auditLog(options: AuditOptions): Promise<void> {
  const { event, userId, email, ip, userAgent, path, metadata, severity = "info" } = options;

  const logPayload = {
    event,
    userId: userId || undefined,
    email: email || undefined,
    ip: ip || undefined,
    userAgent: userAgent || undefined,
    path: path || undefined,
    metadata: metadata || undefined,
    severity,
  };

  // Console log for Vercel log aggregation
  logger.info("AUDIT", logPayload);

  // Async DB write — fire and forget
  try {
    await prisma.auditLog.create({
      data: {
        event: logPayload.event,
        userId: logPayload.userId || null,
        email: logPayload.email || null,
        ip: logPayload.ip || null,
        userAgent: logPayload.userAgent || null,
        path: logPayload.path || null,
        metadata: logPayload.metadata ? (logPayload.metadata as any) : null,
        severity: logPayload.severity,
      },
    });
  } catch (dbError) {
    // Don't fail the request if audit logging fails
    logger.error("Audit log DB write failed", dbError as Error, logPayload);
  }
}

/**
 * Extract client info from a Request for audit logging.
 */
export function getClientInfo(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}
