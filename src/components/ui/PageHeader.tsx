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
      <div className="min-w-0">
        {kicker && (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            {kicker}
          </p>
        )}
        <h1 className={"sakala-page-title " + (kicker ? "mt-2" : "")}>
          {title}
        </h1>
        {description && (
          <p className="sakala-page-description">{description}</p>
        )}
      </div>
      {action && (
        <div className="w-full shrink-0 pt-0.5 md:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
