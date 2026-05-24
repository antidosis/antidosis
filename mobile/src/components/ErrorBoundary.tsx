import { Component, type ReactNode } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";

/* ═══════════════════════════════════════════════════════════════
   ERROR BOUNDARY — Graceful crash recovery
   Catches React rendering errors and shows a terminal-style
   error screen instead of a white screen.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    /* errors are handled by the UI; no production logging */
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] flex flex-col items-center justify-center px-6 bg-[var(--void)]">
          <AlertTriangle size={40} className="text-[var(--ruby)] mb-4" />
          <p className="font-mono text-xs text-[var(--leather)] mb-2">$ fatal_error --trace</p>
          <h1 className="heading-display text-lg text-[var(--gold)] mb-2 text-center">
            Something went wrong
          </h1>
          <p className="text-xs text-[var(--leather)] text-center mb-6 max-w-xs md:max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => {
              hapticImpact("medium");
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--sun)] text-[var(--void)] font-mono text-xs font-medium tap-highlight-none active:scale-95 transition-transform"
          >
            <RotateCcw size={14} />
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
