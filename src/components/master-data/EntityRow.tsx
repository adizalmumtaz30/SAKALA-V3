import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";

interface EntityRowProps {
  icon: ReactNode;
  name: string;
  meta?: string;
  status: "active" | "inactive";
  id: string;
  toggleAction: (formData: FormData) => Promise<void>;
}

export function EntityRow({ icon, name, meta, status, id, toggleAction }: EntityRowProps) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-hairline-strong text-ink-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] text-ink">{name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {meta && <span className="text-[12px] text-ink-muted">{meta}</span>}
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <ToggleStatusButton id={id} status={status} action={toggleAction} />
      </div>
    </div>
  );
}
