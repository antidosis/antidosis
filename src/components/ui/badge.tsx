import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase transition-colors font-mono",
  {
    variants: {
      variant: {
        default: "bg-[#f5b800] text-[#0c0c0c] font-bold",
        secondary: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]",
        outline: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]",
        success: "bg-transparent text-[#7cb87c] border border-[#7cb87c]/30",
        warning: "bg-transparent text-[#c9b87c] border border-[#c9b87c]/30",
        destructive: "bg-transparent text-[#c97c7c] border border-[#c97c7c]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
