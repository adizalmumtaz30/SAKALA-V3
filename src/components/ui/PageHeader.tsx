import type { ReactNode } from "react";

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ kicker, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {kicker && (
          <p className="text-[10.5px] font-medium tracking-wide text-ink-faint">
            {kicker}
          </p>
        )}
        <h1 className={`text-[20px] font-semibold text-ink ${kicker ? "mt-1" : ""}`}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}
