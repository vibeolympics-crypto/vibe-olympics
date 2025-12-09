import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, label, helperText, id, ...props }, ref) => {
    // useId는 항상 호출해야 함 (조건부 호출 금지)
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    
    return (
      <div className="relative w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] transition-all duration-200",
            "border-[var(--bg-border)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:ring-[var(--accent-red)]",
            icon && "pl-10",
            label && "mt-0",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-[var(--accent-red)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
