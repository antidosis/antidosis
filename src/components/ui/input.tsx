import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full bg-inset border border-line px-3 py-2 text-sm text-gold transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ash focus-visible:outline-none focus-visible:border-sun focus-visible:shadow-[0_0_12px_rgba(245,166,35,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
