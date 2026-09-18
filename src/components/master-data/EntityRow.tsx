import type { ReactNode } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";

interface EntityRowProps {
  icon: ReactNode;
  name: string;
  meta?: string;
  status: "active" | "inactive";
  id: string;
  toggleAction: (formData: FormData) => Promise<void>;
  detailHref?: string;
  /** Dependency nyata dari diagnostics — memicu ConfirmDialog (Bagian E.2.1). */
  dependencyWarnings?: string[];
}

/**
 * Kartu entitas untuk grid (Bagian E.1.3: grid kartu, bukan daftar vertikal
 * panjang). Aksi tetap hover-reveal supaya daftar tidak terlihat ramai,
 * tapi ikut muncul saat fokus keyboard demi aksesibilitas.
 */
export function EntityRow({
  icon,
  name,
  meta,
  status,
  id,
  toggleAction,
  detailHref,
  dependencyWarnings,
}: EntityRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 transition-all duration-200 hover:border-hairline-strong hover:bg-surface-elevated focus-within:border-hairline-strong">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-hairline-strong text-ink-muted transition-colors group-hover:text-ink">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        {detailHref ? (
          <Link
            href={detailHref}
            className="block truncate text-[13.5px] text-ink transition-colors hover:text-accent-teal"
          >
            {name}
          </Link>
        ) : (
          <p className="truncate text-[13.5px] text-ink">{name}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          {meta && <span className="text-[12px] text-ink-muted">{meta}</span>}
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <ToggleStatusButton
          id={id}
          status={status}
          action={toggleAction}
          label={name}
          dependencyWarnings={dependencyWarnings}
        />
      </div>
    </div>
  );
}
