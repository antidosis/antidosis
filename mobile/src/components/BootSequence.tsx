import { useEffect, useState, useRef } from "react";
import { ShieldCheck, Lock, Users } from "lucide-react";
import { getPref, setPref } from "@mobile/lib/native";
import { TerminalCursor } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   BOOT SEQUENCE
   Full-screen terminal boot animation on first app launch.
   Stored in Capacitor Preferences so it only plays once.
   ═══════════════════════════════════════════════════════════════ */

interface BootLine {
  text: string;
  status?: "ok" | "info" | "warn";
  delay: number;
}

const BOOT_LINES: BootLine[] = [
  { text: "initializing kernel...", status: "ok", delay: 100 },
  { text: "mounting filesystems...", status: "ok", delay: 180 },
  { text: "loading modules: auth, exchange, terminal...", status: "ok", delay: 260 },
  { text: "connecting to peer network...", status: "info", delay: 340 },
  { text: "verifying cryptographic signatures...", status: "ok", delay: 420 },
  { text: "syncing local state...", status: "ok", delay: 500 },
  { text: "ready.", status: "ok", delay: 700 },
];

const STORAGE_KEY = "boot-sequence-completed";

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(false);
  const [linesRevealed, setLinesRevealed] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPref(STORAGE_KEY).then((val) => {
      if (cancelled) return;
      if (val !== "true") {
        setShouldShow(true);
        setVisible(true);
      } else {
        onComplete();
      }
    });
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  // Reveal lines sequentially
  useEffect(() => {
    if (!shouldShow) return;
    if (linesRevealed >= BOOT_LINES.length) {
      // All lines revealed — hold for a moment then fade out
      timerRef.current = setTimeout(() => {
        setFadeOut(true);
        timerRef.current = setTimeout(() => {
          setVisible(false);
          setPref(STORAGE_KEY, "true");
          onComplete();
        }, 600);
      }, 900);
      return;
    }

    const delay = BOOT_LINES[linesRevealed].delay;
    timerRef.current = setTimeout(() => {
      setLinesRevealed((prev) => prev + 1);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [linesRevealed, shouldShow, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[100] flex flex-col items-center justify-center
        bg-[var(--void)] px-6
        transition-opacity duration-700
        ${fadeOut ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Logo + Brand */}
      <div
        className={`
          flex flex-col items-center mb-8
          transition-all duration-700
          ${linesRevealed >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}
      >
        <div className="text-[var(--gold)] font-sans font-extrabold text-2xl tracking-tight mb-3">
          ANTIDOSIS
        </div>
        <div className="flex items-center gap-4">
          <ShieldCheck size={16} className="text-[var(--sun)]" />
          <Lock size={16} className="text-[var(--sun)]" />
          <Users size={16} className="text-[var(--sun)]" />
        </div>
      </div>

      {/* Terminal Box */}
      <div
        className={`
          w-full max-w-xs md:max-w-md border border-[var(--bronze)] bg-[var(--void-raised)] rounded-md p-4
          transition-all duration-700
          ${linesRevealed >= 2 ? "opacity-100" : "opacity-0"}
        `}
      >
        <div className="space-y-1.5">
          {BOOT_LINES.slice(0, linesRevealed).map((line, i) => (
            <div
              key={i}
              className="font-mono text-xs animate-terminal-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {line.status === "ok" && <span className="text-[var(--emerald)] mr-2">[OK]</span>}
              {line.status === "info" && <span className="text-[var(--mercury)] mr-2">[INFO]</span>}
              {line.status === "warn" && (
                <span className="text-[var(--amber-alert)] mr-2">[WARN]</span>
              )}
              <span
                className={line.text === "ready." ? "text-[var(--sun)]" : "text-[var(--leather)]"}
              >
                {line.text}
              </span>
              {line.text === "ready." && <TerminalCursor color="sun" size="sm" className="ml-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Skip hint */}
      <div
        className={`
          mt-6 text-[10px] font-mono text-[var(--leather)]/50 uppercase tracking-widest
          transition-opacity duration-500
          ${linesRevealed >= 3 ? "opacity-100" : "opacity-0"}
        `}
      >
        tap to skip
      </div>

      {/* Tap to skip handler */}
      <button
        className="absolute inset-0 z-10"
        onClick={() => {
          setFadeOut(true);
          setTimeout(() => {
            setVisible(false);
            setPref(STORAGE_KEY, "true");
            onComplete();
          }, 300);
        }}
        aria-label="Skip boot sequence"
      />
    </div>
  );
}
