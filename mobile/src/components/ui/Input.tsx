import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   INPUT — Terminal-styled text input
   bg-[#0f0c0a], bronze border, gold focus glow
   ═══════════════════════════════════════════════════════════════ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightElement?: ReactNode;
  label?: string;
  error?: string;
}

export function Input({ icon, rightElement, label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--leather)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-[var(--leather)] pointer-events-none">{icon}</div>
        )}
        <input
          className={`
            w-full h-10 px-3 py-2
            bg-[var(--void-input)]
            border border-[var(--bronze)]
            text-[var(--gold)] text-sm
            placeholder:text-[var(--leather)]
            rounded-md
            transition-all duration-200
            focus:outline-none focus:border-[var(--sun)]
            focus:shadow-[0_0_12px_rgba(245,166,35,0.15)]
            disabled:opacity-40 disabled:cursor-not-allowed
            ${icon ? "pl-9" : ""}
            ${rightElement ? "pr-9" : ""}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 text-[var(--leather)]">{rightElement}</div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[var(--ruby)]">{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEXTAREA — Terminal-styled multi-line input
   ═══════════════════════════════════════════════════════════════ */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--leather)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full min-h-[100px] px-3 py-2
          bg-[var(--void-input)]
          border border-[var(--bronze)]
          text-[var(--gold)] text-sm
          placeholder:text-[var(--leather)]
          rounded-md resize-y
          transition-all duration-200
          focus:outline-none focus:border-[var(--sun)]
          focus:shadow-[0_0_12px_rgba(245,166,35,0.15)]
          disabled:opacity-40 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--ruby)]">{error}</p>}
    </div>
  );
}
