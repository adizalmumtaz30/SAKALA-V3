import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong text-ink-faint">
        {icon}
      </div>
      <p className="text-[13px] text-ink-faint">{message}</p>
    </div>
  );
}
