import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-sun text-onaccent font-bold hover:bg-sunhi hover:shadow-[0_0_20px_rgba(245,166,35,0.3)]",
        secondary:
          "bg-transparent text-gold border border-line hover:border-sun hover:text-sun hover:shadow-[0_0_15px_rgba(245,166,35,0.1)]",
        ghost: "bg-transparent text-parchment hover:text-gold hover:bg-raise",
        link: "bg-transparent text-sun hover:underline underline-offset-4 hover:glow-gold-subtle",
        destructive:
          "bg-transparent text-bad border border-bad/20 hover:border-bad/40 hover:bg-bad/5 hover:shadow-[0_0_15px_rgba(255,82,82,0.1)]",
        outline:
          "bg-transparent text-parchment border border-line hover:border-linehi hover:text-gold",
        mercury:
          "bg-transparent text-mercury border border-mercury/20 hover:border-mercury/40 hover:bg-mercury/5 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)]",
        quintessence:
          "bg-transparent text-quint border border-quint/20 hover:border-quint/40 hover:bg-quint/5 hover:shadow-[0_0_20px_rgba(178,75,245,0.15)]",
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
