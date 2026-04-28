"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => dismiss(id), 5000);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-[#00e676]" />,
    error: <AlertCircle className="h-4 w-4 text-[#ff5252]" />,
    info: <Info className="h-4 w-4 text-[#00e5ff]" />,
  };

  const borders = {
    success: "border-[#00e676]/30",
    error: "border-[#ff5252]/30",
    info: "border-[#00e5ff]/30",
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-md bg-[#12100e] border ${borders[t.type]} rounded-md p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200`}
          >
            <div className="mt-0.5">{icons[t.type]}</div>
            <p className="text-sm text-[#e8d5a3] flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors mt-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
