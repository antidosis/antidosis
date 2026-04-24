import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[11px] font-medium tracking-wide uppercase text-[#7a6b4a] peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-mono",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
