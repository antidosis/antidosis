"use client";

import { useState, useEffect } from "react";
import { TerminalCursor } from "./terminal-cursor";

const BOOT_LINES = [
  { text: "ANTIDOSIS v1.0.4 -- boot sequence initiated", delay: 0 },
  { text: "", delay: 100 },
  { text: "[OK] loading kernel modules...", delay: 300 },
  { text: "[OK] mounting marketplace filesystem...", delay: 600 },
  { text: "[OK] initializing trust protocol...", delay: 900 },
  { text: "[OK] connecting to Central Coast node...", delay: 1200 },
  { text: "[OK] 4 peers online", delay: 1500 },
  { text: "", delay: 1800 },
  { text: "system ready.", delay: 2200 },
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => {
            setShowCursor(false);
            setTimeout(() => {
              setDone(true);
              setTimeout(onComplete, 400);
            }, 300);
          }, 600);
        }
      }, line.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0c0c] flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <pre className="text-[13px] leading-relaxed whitespace-pre-wrap">
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className={line.text.startsWith("[OK]") ? "text-[#7cb87c]" : ""}>
              {line.text || "\u00A0"}
            </div>
          ))}
          {showCursor && visibleLines > 0 && (
            <div>
              <TerminalCursor />
            </div>
          )}
        </pre>
      </div>
    </div>
  );
}
