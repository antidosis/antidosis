/**
 * Divider — Gradient fade line
 *
 * Uses linear-gradient(90deg, transparent, var(--bronze), transparent)
 * to create a subtle horizontal rule that fades at both edges.
 */
export function Divider({ className = "" }: { className?: string }) {
  return <div className={`divider ${className}`} />;
}
