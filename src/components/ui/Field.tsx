import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, required, description, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-status-attention" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-[12px] leading-5 text-status-blocked">
          {error}
        </p>
      ) : description ? (
        <p className="text-[12px] leading-5 text-ink-faint">{description}</p>
      ) : null}
    </div>
  );
}
