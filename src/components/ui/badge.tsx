import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-white/50 px-2 py-1 font-pixel text-[9px] uppercase tracking-[0.18em] text-white",
        className
      )}
      {...props}
    />
  );
}
