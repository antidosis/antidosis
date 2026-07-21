/* ═══════════════════════════════════════════════════════════════
   CRASH REPORTER — Firebase Crashlytics wrapper
   Safely records JS errors to Crashlytics when available.
   Gracefully no-ops if Firebase isn't configured (dev builds).
   ═══════════════════════════════════════════════════════════════ */

import { Capacitor } from "@capacitor/core";

let crashlyticsModule: typeof import("@capacitor-firebase/crashlytics") | null = null;

async function getCrashlytics() {
  if (!Capacitor.isNativePlatform()) return null;
  if (crashlyticsModule) return crashlyticsModule;
  try {
    crashlyticsModule = await import("@capacitor-firebase/crashlytics");
    return crashlyticsModule;
  } catch {
    return null;
  }
}

export async function setCrashlyticsUserId(userId: string) {
  const mod = await getCrashlytics();
  if (!mod) return;
  try {
    await mod.FirebaseCrashlytics.setUserId({ userId });
  } catch {
    /* ignore — Firebase may not be initialized */
  }
}

export async function logCrashlyticsMessage(message: string) {
  const mod = await getCrashlytics();
  if (!mod) return;
  try {
    await mod.FirebaseCrashlytics.log({ message });
  } catch {
    /* ignore */
  }
}

export async function recordException(error: Error) {
  const mod = await getCrashlytics();
  if (!mod) return;
  try {
    await mod.FirebaseCrashlytics.recordException({
      message: error.message || "Unknown error",
      stacktrace: error.stack ? parseStackTrace(error.stack) : undefined,
    });
  } catch {
    /* ignore — Firebase may not be initialized */
  }
}

function parseStackTrace(
  stack: string
): { lineNumber?: number; fileName?: string; functionName?: string }[] {
  const lines = stack.split("\n");
  const frames: { lineNumber?: number; fileName?: string; functionName?: string }[] = [];
  for (const line of lines) {
    const match = line.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/);
    if (match) {
      frames.push({
        functionName: match[1]?.trim(),
        fileName: match[2]?.trim(),
        lineNumber: match[3] ? parseInt(match[3], 10) : undefined,
      });
    }
  }
  return frames;
}

export function initGlobalErrorHandlers() {
  if (!Capacitor.isNativePlatform()) return;

  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (error) {
      recordException(error);
    } else {
      recordException(new Error(String(message)));
    }
    if (typeof originalOnError === "function") {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      recordException(reason);
    } else {
      recordException(new Error(String(reason)));
    }
  });
}
