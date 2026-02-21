import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#1f883d] text-white border border-[#1b7f37] hover:bg-[#1a7f37] shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90",
        outline:
          "border border-[#d0d7de] bg-[#f6f8fa] text-foreground hover:bg-[#eaeef2] shadow-sm",
        secondary:
          "bg-[#f6f8fa] border border-[#d0d7de] text-foreground hover:bg-[#eaeef2]",
        ghost: "hover:bg-[#eaeef2] text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary:
          "bg-primary text-primary-foreground border border-primary hover:bg-[#0757b5] shadow-sm",
      },
      size: {
        default: "h-8 px-3 py-1 text-xs",
        sm: "h-7 rounded-md px-2 text-xs",
        lg: "h-9 rounded-md px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
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
