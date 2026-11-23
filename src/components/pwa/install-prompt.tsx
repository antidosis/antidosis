"use client";

import { useEffect, useState } from "react";

import { Download, Radio, Share, X } from "lucide-react";

import { cn } from "@/lib/utils";

const DISMISS_KEY = "antidosis-install-dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * PWA install prompt. Chrome/Edge/Android fire `beforeinstallprompt` (held
 * here and replayed when the member clicks Install). iOS Safari never fires
 * it — members there get short "Add to Home Screen" instructions instead.
 * Dismissals are remembered for a week. No banner when already installed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;
    if (typeof window === "undefined" || !window.isSecureContext) return;
    if (!("serviceWorker" in navigator)) return;

    // Register the SW — required for installability.
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    if (isIos()) {
      // iOS has no beforeinstallprompt — show instructions after a beat.
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    setVisible(false);
    setShowIosHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // private mode — banner simply won't persist
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-3">
      <div className="flex w-full max-w-md items-center gap-3 border border-sun/30 bg-raise/95 p-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-sun/30 bg-sun/10">
          <Radio className="h-5 w-5 text-sun" />
        </div>

        {showIosHelp ? (
          <div className="min-w-0 flex-1 text-xs text-parchment">
            <p className="flex items-center gap-1.5 text-gold">
              <Share className="h-3.5 w-3.5" /> Install on your iPhone or iPad
            </p>
            <p className="mt-1 text-ash">
              Tap the Share button in Safari, then scroll and tap{" "}
              <span className="text-parchment">&ldquo;Add to Home Screen&rdquo;</span>.
            </p>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gold">Install antidosis as an app</p>
            <p className="text-[11px] text-ash">
              One tap from your home screen — no app store needed.
            </p>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {isIos() && !showIosHelp ? (
            <button
              onClick={() => setShowIosHelp(true)}
              className="rounded bg-sun px-3 py-1.5 text-xs font-medium text-void transition-colors hover:bg-sunhi"
            >
              How
            </button>
          ) : (
            <button
              onClick={install}
              disabled={!deferred}
              className={cn(
                "flex items-center gap-1.5 rounded bg-sun px-3 py-1.5 text-xs font-medium text-void transition-colors hover:bg-sunhi",
                !deferred && "opacity-50"
              )}
            >
              <Download className="h-3.5 w-3.5" /> Install
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="rounded p-1.5 text-ash transition-colors hover:text-gold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
