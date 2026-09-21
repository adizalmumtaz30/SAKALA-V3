import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  error?: boolean;
}

export function Input({ className, leadingIcon, trailingAction, error, ...props }: InputProps) {
  return (
    <div className="relative">
      {leadingIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">{leadingIcon}</span>}
      <input
        {...props}
        aria-invalid={error || undefined}
        className={cn(
          "sakala-focus-ring h-9 w-full rounded-lg border bg-surface px-3 text-[13px] text-ink outline-none placeholder:text-ink-faint",
          "border-hairline-strong transition-colors duration-150 hover:border-hairline-strong focus:border-accent-teal",
          "disabled:cursor-not-allowed disabled:bg-surface/50 disabled:opacity-55",
          leadingIcon && "pl-9",
          trailingAction && "pr-10",
          error && "border-status-blocked focus:border-status-blocked",
          className,
        )}
      />
      {trailingAction && <span className="absolute right-1 top-1/2 -translate-y-1/2">{trailingAction}</span>}
    </div>
  );
}

export function Textarea({ className, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={error || undefined}
      className={cn(
        "sakala-focus-ring min-h-24 w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-[13px] leading-5 text-ink outline-none placeholder:text-ink-faint",
        "border-hairline-strong transition-colors duration-150 hover:border-hairline-strong focus:border-accent-teal",
        "disabled:cursor-not-allowed disabled:bg-surface/50 disabled:opacity-55",
        error && "border-status-blocked focus:border-status-blocked",
        className,
      )}
    />
  );
}
