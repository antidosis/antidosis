import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-sun text-onaccent font-bold",
        outline: "bg-transparent text-parchment border border-line",
        success: "bg-transparent text-ok border border-ok/30",
        warning: "bg-transparent text-alert border border-alert/30",
        destructive: "bg-transparent text-bad border border-bad/30",
        mercury: "bg-transparent text-mercury border border-mercury/30",
        quintessence: "bg-transparent text-quint border border-quint/30",
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
