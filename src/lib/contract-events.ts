import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

/**
 * Autonomous, append-only contract audit trail.
 *
 * Every mutation point in the contract lifecycle calls logContractEvent with
 * the actor, the action, a structured detail payload, and the status
 * transition. Events are timestamped by the database (`createdAt`,
 * millisecond precision) and are never updated or deleted.
 *
 * Logging must never break the business flow — failures are swallowed to the
 * error log. Missing an audit row is bad; failing a signature because of an
 * audit write is worse.
 */

export const CONTRACT_EVENT_ACTIONS = [
  "created",
  "invited",
  "invite_claimed",
  "terms_updated",
  "terms_submitted",
  "terms_agreed",
  "terms_rejected",
  "terms_locked",
  "signed",
  "completion_marked",
  "completed",
  "cancel_requested",
  "cancel_request_accepted",
  "cancel_request_declined",
  "cancel_escalated",
  "cancelled",
  "force_cancelled",
  "reminder_sent",
  "review_submitted",
] as const;

export type ContractEventAction = (typeof CONTRACT_EVENT_ACTIONS)[number];

export interface LogContractEventInput {
  contractId: string;
  /** Profile id of the party (or admin) performing the action. Null = system. */
  actorId?: string | null;
  action: ContractEventAction;
  /** Structured, JSON-serialisable context for the action. */
  detail?: Record<string, unknown>;
  statusBefore?: string | null;
  statusAfter?: string | null;
}

export async function logContractEvent(input: LogContractEventInput): Promise<void> {
  try {
    await prisma.contractEvent.create({
      data: {
        contractId: input.contractId,
        actorId: input.actorId ?? null,
        action: input.action,
        detail: (input.detail ?? undefined) as never,
        statusBefore: input.statusBefore ?? null,
        statusAfter: input.statusAfter ?? null,
      },
    });
  } catch (err) {
    logger.error("Failed to write contract audit event", err instanceof Error ? err : undefined, {
      contractId: input.contractId,
      action: input.action,
    });
  }
}

/** Load the audit trail for one contract, newest first. */
export async function getContractEvents(contractId: string, limit = 200) {
  return prisma.contractEvent.findMany({
    where: { contractId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { actor: { select: { id: true, fullName: true } } },
  });
}
