import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   PAGE TRANSITION
   Simple fade/slide wrapper for route changes.
   150ms ease-out for snappy mobile feel.
   ═══════════════════════════════════════════════════════════════ */

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitioning(false);
      }, 80);
      return () => clearTimeout(timer);
    } else {
      // Same route — just update children without transition
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  return (
    <div
      className={`
        transition-all duration-150 ease-out
        ${transitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}
      `}
    >
      {displayChildren}
    </div>
  );
}
