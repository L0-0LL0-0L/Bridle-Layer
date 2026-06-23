import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border-2 px-4 py-3 text-xs uppercase tracking-[0.24em] transition focus:outline-none focus:ring-2 focus:ring-white/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-white bg-white text-black shadow-[4px_4px_0_#555] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#555]",
        ghost: "border-white/40 bg-black text-white hover:border-white hover:bg-white/10",
        danger: "border-red-200 bg-red-950/50 text-red-100 hover:bg-red-900/70"
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3 text-[10px]",
        lg: "h-14 px-6 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ asChild, className, variant, size, ...props }, ref) => {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{ className?: string }>;

    return React.cloneElement(child, {
      className: cn(classes, child.props.className)
    });
  }

  return <button className={classes} ref={ref} {...props} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
