"use client";

import { useEffect } from "react";

import { X } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Store popup — informational content (how it works, sell, sellers, list)
 * lives in these overlays so the page itself stays a clean shop floor.
 * Portalled to <body>: the .chapter scene wrapper uses content-visibility
 * (paint containment), which would trap a fixed overlay inside the page.
 */
export function StoreModal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-void/85 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`vessel flex max-h-[85vh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-b-lg ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-5 py-3.5">
          <h2 className="heading-display text-lg text-gold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1.5 text-ash transition-colors hover:bg-surface hover:text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
