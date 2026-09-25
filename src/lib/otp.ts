import { createHash } from "node:crypto";

/**
 * OTP codes are stored hashed (sha256 of code + mobile) so a database read
 * alone cannot reveal active verification codes.
 *
 * Server-only — uses node:crypto. Keep it out of client bundles
 * (mobile.ts stays client-safe; import this from route handlers only).
 */
export function hashOtpCode(code: string, mobile: string): string {
  return createHash("sha256").update(`${code}:${mobile}`).digest("hex");
}
