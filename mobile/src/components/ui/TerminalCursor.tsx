/**
 * TerminalCursor — Blinking block cursor
 *
 * Used after headings, prompts, or anywhere a terminal cursor
 * would appear in the Antidosis aesthetic.
 *
 * Props:
 *   color? — "sun" | "mercury" | "quintessence" | "emerald" | "gold"
 *   size?  — "sm" | "md" | "lg"
 */

const colorMap = {
  sun: "bg-[var(--sun)]",
  mercury: "bg-[var(--mercury)]",
  quintessence: "bg-[var(--quintessence)]",
  emerald: "bg-[var(--emerald)]",
  gold: "bg-[var(--gold)]",
};

const sizeMap = {
  sm: "w-1.5 h-3",
  md: "w-2 h-4",
  lg: "w-2.5 h-5",
};

interface TerminalCursorProps {
  color?: keyof typeof colorMap;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function TerminalCursor({
  color = "sun",
  size = "md",
  className = "",
}: TerminalCursorProps) {
  return (
    <span
      className={`inline-block align-middle animate-blink ${colorMap[color]} ${sizeMap[size]} ${className}`}
      aria-hidden="true"
    />
  );
}
