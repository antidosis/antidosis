/**
 * Server-safe plain text sanitizer.
 * Strips all HTML tags and decodes common HTML entities.
 * No DOM dependencies — works in any Node.js environment.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Rich text sanitizer for limited HTML.
 * In a serverless context without a DOM, we strip all tags and return plain text.
 * For true rich-text sanitization, run DOMPurify on the client before sending.
 */
export function sanitizeRichText(input: string): string {
  return sanitizePlainText(input);
}
