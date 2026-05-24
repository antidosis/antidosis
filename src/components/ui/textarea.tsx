import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full bg-[#0f0c0a] border border-[#2a2420] px-3 py-2 text-sm text-[#e8d5a3] transition-all duration-200 placeholder:text-[#7a6b5a] focus-visible:outline-none focus-visible:border-[#f5a623] focus-visible:shadow-[0_0_12px_rgba(245,166,35,0.15)] disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
