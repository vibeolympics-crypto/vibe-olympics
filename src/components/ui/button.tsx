import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] hover:shadow-[0_0_20px_var(--glow-primary)]",
        neon:
          "bg-gradient-to-r from-[var(--primary)] via-[var(--accent-violet)] to-[var(--accent-magenta)] text-white hover:shadow-[0_0_20px_var(--glow-primary),0_0_40px_var(--glow-violet)] hover:-translate-y-0.5",
        outline:
          "border border-[var(--bg-border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--primary)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
        link:
          "text-[var(--primary)] underline-offset-4 hover:underline",
        destructive:
          "bg-[var(--accent-red)] text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]",
        success:
          "bg-[var(--accent-green)] text-white hover:bg-green-600 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]",
        cyan:
          "bg-[var(--accent-cyan)] text-[var(--bg-base)] hover:shadow-[0_0_20px_var(--glow-cyan)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
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
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">로딩 중</span>
            <span aria-hidden="true">로딩 중...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
