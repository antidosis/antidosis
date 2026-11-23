/**
 * Australian Business Number (ABN) validation.
 *
 * Two layers:
 * 1. Checksum — every ABN passes a weighted mod-89 check, cheap and offline.
 * 2. ABR lookup — confirms the ABN is actively registered and returns the
 *    entity name. Requires a free GUID from abr.business.gov.au, set as
 *    ABR_LOOKUP_GUID. When the GUID is not configured, verification falls
 *    back to checksum-only and `verified` stays false.
 */

export const ABR_LOOKUP_GUID_ENV = "ABR_LOOKUP_GUID";

/** Strip formatting (spaces) and keep digits only. */
export function normalizeAbn(value: string): string {
  return value.replace(/\D/g, "");
}

/** Human display form: "12345678901" -> "12 345 678 901". */
export function formatAbn(value: string): string {
  const digits = normalizeAbn(value);
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
}

const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

/** Weighted mod-89 checksum defined by the ATO. */
export function isValidAbnChecksum(value: string): boolean {
  const digits = normalizeAbn(value);
  if (digits.length !== 11) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = digits.charCodeAt(i) - 48;
    sum += ABN_WEIGHTS[i] * (i === 0 ? digit - 1 : digit);
  }
  return sum % 89 === 0;
}

export interface AbrLookupResult {
  valid: boolean;
  entityName: string | null;
}

/**
 * Query the Australian Business Register for the ABN. Returns null when no
 * GUID is configured (callers should treat that as "not configured", not
 * "invalid"). Throws on network failure — callers decide whether to fail
 * closed or fall back to checksum-only.
 */
export async function lookupAbnWithAbr(abn: string): Promise<AbrLookupResult | null> {
  const guid = process.env[ABR_LOOKUP_GUID_ENV];
  const digits = normalizeAbn(abn);
  if (!guid) return null;

  const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${digits}&guid=${encodeURIComponent(guid)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`ABR lookup failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    Abn: string;
    EntityName: string;
    AbnStatus: string;
  };

  if (data.Abn !== digits) {
    return { valid: false, entityName: null };
  }
  // "Active" covers all live registration states; anything else (Cancelled,
  // Deregistered) is not a valid counterparty ABN.
  const active = data.AbnStatus?.startsWith("Active") ?? false;
  return { valid: active, entityName: active ? (data.EntityName ?? null) : null };
}

export interface AbnVerification {
  /** Checksum-valid 11-digit ABN (normalised). */
  normalised: string;
  /** Passes the ATO checksum. */
  checksumValid: boolean;
  /**
   * Confirmed active via the ABR. False when the GUID is not configured,
   * the lookup failed, or the ABN is not active.
   */
  verified: boolean;
  /** Registered entity name when verified. */
  entityName: string | null;
}

/**
 * Full verification pipeline: checksum first, ABR when configured. Never
 * throws on lookup failure — a down ABR degrades to checksum-only rather
 * than blocking a profile update.
 */
export async function verifyAbn(value: string): Promise<AbnVerification> {
  const normalised = normalizeAbn(value);
  if (!isValidAbnChecksum(normalised)) {
    return { normalised, checksumValid: false, verified: false, entityName: null };
  }

  try {
    const abr = await lookupAbnWithAbr(normalised);
    if (abr === null) {
      return { normalised, checksumValid: true, verified: false, entityName: null };
    }
    return { normalised, checksumValid: true, verified: abr.valid, entityName: abr.entityName };
  } catch {
    return { normalised, checksumValid: true, verified: false, entityName: null };
  }
}
