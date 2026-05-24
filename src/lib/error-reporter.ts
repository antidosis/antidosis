/**
 * Client-side error reporter.
 *
 * Captures unhandled errors and reports them as structured JSON logs.
 * In production, these logs are captured by the platform's log aggregator.
 */

interface ErrorReport {
  type: "unhandled_error" | "unhandled_rejection" | "resource_error";
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  source?: string;
  lineno?: number;
  colno?: number;
}

function reportError(report: ErrorReport) {
  if (process.env.NODE_ENV === "production") {
    console.error(JSON.stringify(report));
  } else {
    console.error("[ErrorReporter]", report);
  }
}

export function initErrorReporter() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    reportError({
      type: "unhandled_error",
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportError({
      type: "unhandled_rejection",
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  });
}
