/**
 * Australian mobile number utilities.
 * Format: +61 4XX XXX XXX (10 digits after +61)
 */

export function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("04")) {
    return `+61${digits.slice(1)}`;
  }
  if (digits.startsWith("4")) {
    return `+61${digits}`;
  }
  if (digits.startsWith("614")) {
    return `+${digits}`;
  }
  return input;
}

export function isValidAustralianMobile(input: string): boolean {
  const normalized = normalizeMobile(input);
  return /^\+614\d{8}$/.test(normalized);
}

export function maskMobile(mobile: string): string {
  const normalized = normalizeMobile(mobile);
  if (!/^\+614\d{8}$/.test(normalized)) return mobile;
  return `+61 4XX XXX ${normalized.slice(-3)}`;
}
