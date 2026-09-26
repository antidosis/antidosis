"use client";

import { useMemo, useRef, useCallback, useEffect } from "react";

import { getThemeColors } from "./terminal-render";

export function useThemeStyles(themeName: string) {
  const t = useMemo(() => getThemeColors(themeName), [themeName]);
  return {
    // The default skin follows the site's active theme (light/dark tokens);
    // named skins (cyberpunk, matrix, minimal) are fixed palettes by design.
    vars:
      themeName === "default"
        ? ({
            "--term-bg": "rgb(var(--c-void))",
            "--term-sidebar-bg": "rgb(var(--c-inset))",
            "--term-accent": "rgb(var(--c-sun))",
            "--term-accent-hover": "rgb(var(--c-sunhi))",
            "--term-text": "rgb(var(--c-gold))",
            "--term-muted": "rgb(var(--c-ash))",
            "--term-border": "rgb(var(--c-line))",
            "--term-error": "rgb(var(--c-bad))",
            "--term-success": "rgb(var(--c-ok))",
          } as React.CSSProperties)
        : ({
            "--term-bg": t.bg,
            "--term-sidebar-bg": t.sidebarBg,
            "--term-accent": t.accent,
            "--term-accent-hover": t.accentHover,
            "--term-text": t.text,
            "--term-muted": t.muted,
            "--term-border": t.border,
            "--term-error": t.error,
            "--term-success": t.success,
          } as React.CSSProperties),
    t,
  };
}

export function useNotificationSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    if (!enabled) return;
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }, [enabled]);

  return play;
}

export function useSwipeGesture(onOpen: () => void, onClose: () => void) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth >= 768) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (dx > 80 && touchStartX.current < 40) onOpen();
      if (dx < -80) onClose();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onOpen, onClose]);
}
