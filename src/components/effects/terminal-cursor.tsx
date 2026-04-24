"use client";

export function TerminalCursor({ dim = false }: { dim?: boolean }) {
  return <span className={dim ? "cursor-blink-dim" : "cursor-blink"} />;
}
