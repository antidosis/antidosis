import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f5b800] disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#f5b800] text-[#0c0c0c] font-bold hover:bg-[#ffcc00]",
        secondary: "bg-transparent text-[#e8c97c] border border-[#2a2a2a] hover:border-[#f5b800] hover:text-[#f5b800]",
        ghost: "bg-transparent text-[#7a6b4a] hover:text-[#e8c97c]",
        link: "bg-transparent text-[#f5b800] hover:underline underline-offset-4",
        destructive: "bg-transparent text-[#c97c7c] border border-[#c97c7c]/20 hover:border-[#c97c7c]/40",
        outline: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#e8c97c]",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-[12px]",
        lg: "px-6 py-3 text-[14px]",
        icon: "h-9 w-9",
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
