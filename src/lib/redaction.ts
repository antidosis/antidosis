/**
 * Redaction engine for sensitive data.
 *
 * Rules:
 * - Document numbers are masked, showing only last 4 digits
 * - Expiry dates are NEVER redacted
 * - Description text is scanned for common sensitive patterns
 * - Dates in description text (YYYY-MM-DD, DD/MM/YYYY, etc.) are preserved
 */

export interface RedactionPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

const DESCRIPTION_PATTERNS: RedactionPattern[] = [
  {
    name: "CREDIT_CARD",
    pattern: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: "****-****-****-####",
  },
  {
    name: "SSN",
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    replacement: "***-**-####",
  },
  {
    name: "PASSPORT",
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,
    replacement: "********",
  },
  {
    name: "ABN",
    pattern: /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g,
    replacement: "** *** *** ***",
  },
  {
    name: "TFN",
    pattern: /\b\d{3}\s?\d{3}\s?\d{3}\b/g,
    replacement: "*** *** ***",
  },
  {
    name: "ACN",
    pattern: /\b\d{3}\s?\d{3}\s?\d{3}\b/g,
    replacement: "*** *** ***",
  },
  // Phone numbers with country codes
  {
    name: "PHONE_INTL",
    pattern: /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,4}/g,
    replacement: "+* (***) ***-****",
  },
  // Generic 8+ digit sequences that don't look like dates
  {
    name: "LONG_NUMBER",
    pattern: /\b\d{8,}\b/g,
    replacement: "********",
  },
];

// Date patterns that should be preserved (negative check)
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // 2026-04-24
  /^\d{2}\/\d{2}\/\d{4}$/, // 04/24/2026
  /^\d{2}-\d{2}-\d{4}$/, // 04-24-2026
  /^\d{2}\.\d{2}\.\d{4}$/, // 24.04.2026
  /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i, // 24 April 2026
];

function isDateLike(str: string): boolean {
  return DATE_PATTERNS.some((p) => p.test(str.trim()));
}

/**
 * Mask a document number, revealing only the last 4 digits.
 * Example: "123456789012" → "********9012"
 */
export function redactDocumentNumber(number: string | null | undefined): string {
  if (!number || number.length === 0) return "—";
  if (number.length <= 4) return "*".repeat(number.length);
  const masked = "*".repeat(number.length - 4);
  const visible = number.slice(-4);
  return `${masked}${visible}`;
}

/**
 * Scan and redact sensitive patterns in free-form text.
 * Preserves date-like strings.
 */
export function redactDescription(text: string | null | undefined): string {
  if (!text) return "";

  let result = text;

  for (const { pattern, replacement } of DESCRIPTION_PATTERNS) {
    result = result.replace(pattern, (match) => {
      // Don't redact if it looks like a date
      if (isDateLike(match)) return match;
      return replacement;
    });
  }

  return result;
}

/**
 * Redact a credential object, returning a new object with sensitive data masked.
 * Used for public API responses.
 */
export function redactCredential<T extends { documentNumber?: string | null; description?: string | null; fileUrl?: string | null; backFileUrl?: string | null }>(
  credential: T
): Omit<T, "fileUrl" | "backFileUrl"> {
  const { fileUrl, backFileUrl, ...rest } = credential as any;
  return {
    ...rest,
    documentNumber: rest.documentNumber
      ? redactDocumentNumber(rest.documentNumber)
      : rest.documentNumber,
    description: rest.description
      ? redactDescription(rest.description)
      : rest.description,
  };
}

/**
 * Format a credential for display with all sensitive data redacted.
 */
export function formatCredentialRedacted(credential: {
  title: string;
  type: string;
  documentNumber?: string | null;
  description?: string | null;
  issuedBy?: string | null;
  expiresAt?: Date | null;
}): string {
  const lines: string[] = [];
  lines.push(`📋 ${credential.title}`);
  lines.push(`   Type: ${credential.type}`);

  if (credential.documentNumber) {
    lines.push(`   Number: ${redactDocumentNumber(credential.documentNumber)}`);
  }

  if (credential.issuedBy) {
    lines.push(`   Issued by: ${credential.issuedBy}`);
  }

  if (credential.expiresAt) {
    const date = new Date(credential.expiresAt);
    lines.push(
      `   Expires: ${date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
    );
  }

  if (credential.description) {
    const redacted = redactDescription(credential.description);
    if (redacted !== credential.description) {
      lines.push(`   Note: ${redacted}`);
    } else {
      lines.push(`   Note: ${redacted}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format a credential for sharing in a message.
 */
export function formatCredentialForMessage(credential: {
  title: string;
  type: string;
  documentNumber?: string | null;
  issuedBy?: string | null;
  expiresAt?: Date | null;
}): string {
  const lines: string[] = [];
  lines.push(`📋 Shared credential: ${credential.title}`);
  lines.push(`   Type: ${credential.type}`);

  if (credential.documentNumber) {
    lines.push(`   Number: ${redactDocumentNumber(credential.documentNumber)}`);
  }

  if (credential.issuedBy) {
    lines.push(`   Issued by: ${credential.issuedBy}`);
  }

  if (credential.expiresAt) {
    const date = new Date(credential.expiresAt);
    lines.push(
      `   Expires: ${date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
    );
  }

  lines.push(`   🔒 Full details available upon request`);

  return lines.join("\n");
}
