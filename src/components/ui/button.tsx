import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0806] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#f5a623] text-[#0a0806] font-bold hover:bg-[#ffb84d] hover:shadow-[0_0_20px_rgba(245,166,35,0.3)]",
        secondary:
          "bg-transparent text-[#e8d5a3] border border-[#2a2420] hover:border-[#f5a623] hover:text-[#f5a623] hover:shadow-[0_0_15px_rgba(245,166,35,0.1)]",
        ghost:
          "bg-transparent text-[#b8a078] hover:text-[#e8d5a3] hover:bg-[#1a1714]",
        link:
          "bg-transparent text-[#f5a623] hover:underline underline-offset-4 hover:glow-gold-subtle",
        destructive:
          "bg-transparent text-[#ff5252] border border-[#ff5252]/20 hover:border-[#ff5252]/40 hover:bg-[#ff5252]/5 hover:shadow-[0_0_15px_rgba(255,82,82,0.1)]",
        outline:
          "bg-transparent text-[#b8a078] border border-[#2a2420] hover:border-[#3d3530] hover:text-[#e8d5a3]",
        mercury:
          "bg-transparent text-[#00e5ff] border border-[#00e5ff]/20 hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/5 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)]",
        quintessence:
          "bg-transparent text-[#b24bf5] border border-[#b24bf5]/20 hover:border-[#b24bf5]/40 hover:bg-[#b24bf5]/5 hover:shadow-[0_0_20px_rgba(178,75,245,0.15)]",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-6 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
