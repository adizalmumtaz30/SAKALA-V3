"use client";

import { Menu, User } from "lucide-react";
import type { School } from "@/lib/domain/school";
import type { AcademicYear } from "@/lib/domain/academic-year";
import { AcademicContextTrigger } from "@/components/shell/AcademicContextTrigger";
import { SearchTrigger } from "@/components/shell/SearchTrigger";

interface TopBarProps {
  school: School | null;
  academicYear: AcademicYear | null;
  academicYears: AcademicYear[];
}

function SystemStatus({
  school,
  academicYear,
}: {
  school: School | null;
  academicYear: AcademicYear | null;
}) {
  let dotClass = "bg-status-ready";
  let label = "Siap";

  if (!school) {
    dotClass = "bg-status-blocked";
    label = "Sekolah belum diatur";
  } else if (!academicYear) {
    dotClass = "bg-status-incomplete";
    label = "Tahun ajaran belum dipilih";
  }

  return (
    <div className="hidden items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 md:flex">
      <span className={"h-1.5 w-1.5 rounded-full " + dotClass} />
      <span className="text-[12px] font-medium text-ink-muted">{label}</span>
    </div>
  );
}

export function TopBar({ school, academicYear, academicYears }: TopBarProps) {
  return (
    <header className="relative flex h-[var(--shell-topbar-height)] shrink-0 items-center gap-4 border-b border-hairline bg-canvas px-6">
      <button
        type="button"
        aria-label="Buka navigasi"
        className="rounded-lg p-2 text-ink-muted hover:text-ink md:hidden"
        onClick={() => window.dispatchEvent(new Event("sakala:open-mobile-nav"))}
      >
        <Menu size={19} strokeWidth={1.8} />
      </button>

      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-hairline-strong bg-surface text-[12px] font-medium text-ink-muted">
          {(school?.shortName ?? school?.schoolName ?? "S").slice(0, 1)}
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="max-w-[260px] truncate text-[13px] font-medium text-ink">
            {school?.schoolName ?? "Sekolah belum diatur"}
          </span>
          <span className="text-[11px] text-ink-faint">Operator Workspace</span>
        </div>
      </div>

      <div className="hidden h-6 w-px bg-hairline md:block" />

      <div className="hidden min-w-0 shrink-0 md:block">
        {school && (
          <AcademicContextTrigger
            schoolId={school.id}
            academicYear={academicYear}
            academicYears={academicYears}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        <div className="w-full max-w-[420px]">
          <SearchTrigger />
        </div>
      </div>

      <SystemStatus school={school} academicYear={academicYear} />

      <div className="hidden shrink-0 items-center gap-2 rounded-full border border-hairline bg-surface py-1 pl-1 pr-3 md:flex">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated text-ink-muted">
          <User size={13} strokeWidth={1.75} />
        </div>
        <span className="text-[12px] font-medium text-ink-muted">Admin</span>
      </div>
    </header>
  );
}
