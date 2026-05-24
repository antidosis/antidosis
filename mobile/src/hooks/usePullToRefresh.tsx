import { useRef, useCallback, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   PULL TO REFRESH
   Touch-based pull-down gesture for mobile.
   Triggers callback when pulled past threshold.
   ═══════════════════════════════════════════════════════════════ */

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollTop <= 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isAtTop() || refreshing) return;
      startY.current = e.touches[0].clientY;
      setPulling(true);
    },
    [isAtTop, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && isAtTop()) {
        // Dampen the pull
        const damped = Math.min(delta * 0.5, maxPull);
        setPullDistance(damped);
        // Note: e.preventDefault() removed — touch listeners are passive
        // on scrollable containers in modern browsers. The visual feedback
        // still works; we just don't block native scroll.
      }
    },
    [pulling, refreshing, isAtTop, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, threshold, refreshing, onRefresh]);

  const indicator = (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{
        height: `${pullDistance}px`,
        opacity: pullDistance > 10 ? 1 : 0,
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {refreshing ? (
          <div className="w-5 h-5 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
        ) : (
          <div
            className="w-5 h-5 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] transition-transform"
            style={{
              transform: `rotate(${Math.min((pullDistance / threshold) * 180, 180)}deg)`,
            }}
          />
        )}
        <span className="font-mono text-[9px] text-[var(--leather)] uppercase tracking-wider">
          {refreshing ? "syncing..." : pullDistance >= threshold ? "release" : "pull"}
        </span>
      </div>
    </div>
  );

  return {
    containerRef,
    indicator,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
