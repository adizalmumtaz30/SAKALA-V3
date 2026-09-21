import type { ReactNode } from "react";

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ kicker, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {kicker && (
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            {kicker}
          </p>
        )}
        <h1 className={`text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink ${kicker ? "mt-1.5" : ""}`}>
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="w-full shrink-0 pt-0.5 md:w-auto">{action}</div>}
    </div>
  );
}
