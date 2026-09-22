"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Toolbar({ search, filters, actions, className }: { search?: ReactNode; filters?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {search}
        {filters}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
export function FilterChip({ children, onClear }: { children: ReactNode; onClear?: () => void }) {
  return (
    <button type="button" onClick={onClear} className="sakala-focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline-strong bg-surface px-2.5 text-[12px] text-ink-muted hover:bg-surface-elevated hover:text-ink">
      {children}{onClear && <span aria-hidden className="text-ink-faint">×</span>}
    </button>
  );
}
