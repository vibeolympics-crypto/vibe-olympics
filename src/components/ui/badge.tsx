import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white",
        secondary: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--bg-border)]",
        outline: "border border-[var(--bg-border)] text-[var(--text-secondary)]",
        success: "bg-[var(--accent-green)]/20 text-[var(--accent-green)] border border-[var(--accent-green)]/30",
        warning: "bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30",
        danger: "bg-[var(--accent-red)]/20 text-[var(--accent-red)] border border-[var(--accent-red)]/30",
        cyan: "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30",
        violet: "bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] border border-[var(--accent-violet)]/30",
        magenta: "bg-[var(--accent-magenta)]/20 text-[var(--accent-magenta)] border border-[var(--accent-magenta)]/30",
        free: "bg-[var(--accent-green)]/20 text-[var(--accent-green)] border border-[var(--accent-green)]/30",
        premium: "bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-magenta)] text-white",
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
