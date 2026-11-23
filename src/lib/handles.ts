/**
 * Handle safety. Certain handle patterns can incite deception ("@admin",
 * "@antidosis_support", "@verified") — even though handles are just vanity
 * links, a lookalike official handle on a trust platform is a phishing risk.
 *
 * A handle is reserved when it contains any of these tokens as a substring
 * (case-insensitive). Some over-blocking is intentional: "admiral" loses to
 * "admin" because impersonation resistance matters more than vanity handles.
 */

const RESERVED_TOKENS = [
  "admin",
  "antidosis",
  "support",
  "official",
  "verified",
  "verify",
  "moderator",
  "staff",
  "helpdesk",
  "security",
  "billing",
  "payment",
  "root",
] as const;

export const RESERVED_HANDLE_MESSAGE =
  "That handle is reserved — handles containing admin, support, official, verified, or antidosis can't be claimed.";

export function isReservedHandle(handle: string): boolean {
  const h = handle.toLowerCase();
  return RESERVED_TOKENS.some((token) => h.includes(token));
}
