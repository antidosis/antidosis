import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-generated HTML content.
 * Removes all HTML tags and returns plain text.
 * Use for fields that should never contain HTML.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Sanitize user-generated content that may contain limited HTML.
 * Allows only safe inline formatting: bold, italic, links, line breaks.
 */
export function sanitizeRichText(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "a", "br", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  }).trim();
}
