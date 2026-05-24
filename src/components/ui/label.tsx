import * as React from "react";

import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("text-xs font-medium uppercase tracking-wide text-[#b8a078]", className)}
      {...props}
    />
  );
});
Label.displayName = "Label";

export { Label };
