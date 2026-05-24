import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TOAST PROVIDER — Terminal-styled in-app notifications
   Success=emerald, Error=ruby, Info=mercury, Warning=sun
   ═══════════════════════════════════════════════════════════════ */

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={14} className="text-[var(--emerald)]" />,
  error: <AlertCircle size={14} className="text-[var(--ruby)]" />,
  info: <Info size={14} className="text-[var(--mercury)]" />,
  warning: <AlertTriangle size={14} className="text-[var(--sun)]" />,
};

const STYLES: Record<ToastType, string> = {
  success: "border-[var(--emerald)]/30 bg-[var(--emerald)]/5",
  error: "border-[var(--ruby)]/30 bg-[var(--ruby)]/5",
  info: "border-[var(--mercury)]/30 bg-[var(--mercury)]/5",
  warning: "border-[var(--sun)]/30 bg-[var(--sun)]/5",
};

const TEXT_COLORS: Record<ToastType, string> = {
  success: "text-[var(--emerald)]",
  error: "text-[var(--ruby)]",
  info: "text-[var(--mercury)]",
  warning: "text-[var(--sun)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast: add,
    success: (m) => add(m, "success"),
    error: (m) => add(m, "error"),
    info: (m) => add(m, "info"),
    warning: (m) => add(m, "warning"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed top-0 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pt-4 safe-top pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              flex items-center gap-2.5 px-3 py-2.5 rounded-md border
              shadow-lg backdrop-blur-md
              animate-slide-up
              ${STYLES[toast.type]}
            `}
          >
            {ICONS[toast.type]}
            <span className={`font-mono text-xs ${TEXT_COLORS[toast.type]}`}>{toast.message}</span>
            <button
              onClick={() => remove(toast.id)}
              className="ml-1 p-0.5 rounded text-[var(--leather)] hover:text-[var(--parchment)] tap-highlight-none"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
