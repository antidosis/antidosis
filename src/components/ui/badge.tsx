import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#f5a623] text-[#0a0806] font-bold",
        outline: "bg-transparent text-[#b8a078] border border-[#2a2420]",
        success: "bg-transparent text-[#00e676] border border-[#00e676]/30",
        warning: "bg-transparent text-[#ffb300] border border-[#ffb300]/30",
        destructive: "bg-transparent text-[#ff5252] border border-[#ff5252]/30",
        mercury: "bg-transparent text-[#00e5ff] border border-[#00e5ff]/30",
        quintessence: "bg-transparent text-[#b24bf5] border border-[#b24bf5]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
