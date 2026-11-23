export function safeInternalPath(value: string | null | undefined, fallback = "/exchange"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) {
    return fallback;
  }
  return value;
}
