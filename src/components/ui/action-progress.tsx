"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Staged action progress — the platform's answer to "the button just sits
 * there". While an action is in flight this shows a real-time progress bar
 * that eases toward 90% (never lying about being done) plus a rotating stage
 * label so the member can see work happening. When the action resolves the
 * bar snaps to 100%, flashes, and folds itself away.
 *
 * Usage: always render it, drive it with the pending flag —
 *   <ActionProgress active={isSubmitting} stages={["Checking details", "Publishing"]} />
 */

interface ActionProgressProps {
  /** True while the action is in flight. */
  active: boolean;
  /** Stage labels rotated while waiting — first shows immediately. */
  stages: string[];
  /** Extra classes for the wrapper. */
  className?: string;
}

const STAGE_MS = 1400;
const DONE_HOLD_MS = 650;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function ActionProgress({ active, stages, className }: ActionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [visible, setVisible] = useState(active);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);
  const reducedMotion = usePrefersReducedMotion();

  // React-endorsed "derive state from props" adjustment: reset on the render
  // where `active` flips, instead of setState-inside-an-effect.
  const [prevActive, setPrevActive] = useState(active);
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) {
      setVisible(true);
      setDone(false);
      setProgress(0);
      setStageIndex(0);
    } else {
      // The action resolved — close out gracefully instead of vanishing.
      setDone(true);
      setProgress(100);
    }
  }

  // Progress loop: exponential approach to 90% while active.
  useEffect(() => {
    if (!active) return;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      // 1 - e^(-t/2.2): ~36% at 1s, ~65% at 2.5s, ~85% at 5s — always moving,
      // never claims completion the server hasn't confirmed.
      setProgress(Math.min(90, (1 - Math.exp(-elapsed / 2.2)) * 100));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  // Hold the Done state briefly, then fold away.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setDone(false);
    }, DONE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [done]);

  // Stage rotation.
  useEffect(() => {
    if (!active || stages.length <= 1) return;
    const interval = setInterval(() => {
      setStageIndex((current) => (current + 1) % stages.length);
    }, STAGE_MS);
    return () => clearInterval(interval);
  }, [active, stages.length]);

  if (!visible) return null;

  const stage = done ? "Done" : stages[Math.min(stageIndex, stages.length - 1)];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("w-full", className)}
      data-testid="action-progress"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mercury">
          {stage}
          {!done && !reducedMotion && <span className="animate-pulse">…</span>}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-ash">{Math.round(progress)}%</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line/60">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-gold to-sun",
            !reducedMotion && "transition-[width] duration-150 ease-out",
            done && "from-ok to-ok"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
