import { Search, User } from "lucide-react";
import type { School } from "@/lib/domain/school";
import type { AcademicYear } from "@/lib/domain/academic-year";

interface TopBarProps {
  school: School | null;
  academicYear: AcademicYear | null;
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
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-[12px] text-ink-muted">{label}</span>
    </div>
  );
}

export function TopBar({ school, academicYear }: TopBarProps) {
  return (
    <header className="relative flex h-16 shrink-0 items-center gap-6 border-b border-hairline bg-canvas px-6">
      {/* School Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-hairline-strong bg-surface text-[12px] font-medium text-ink-muted">
          {(school?.shortName ?? school?.schoolName ?? "S").slice(0, 1)}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-medium text-ink">
            {school?.schoolName ?? "Sekolah belum diatur"}
          </span>
          <span className="text-[10.5px] text-ink-faint">
            Operator Workspace
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-hairline" />

      {/* Academic Year Context */}
      <div className="flex flex-col leading-tight">
        <span className="text-[9.5px] font-medium tracking-wide text-ink-faint">
          TAHUN PELAJARAN
        </span>
        {academicYear ? (
          <span className="text-[13px] text-ink">{academicYear.label}</span>
        ) : (
          <span className="text-[13px] text-status-incomplete">
            Belum dipilih
          </span>
        )}
      </div>

      {/* Global Search — visual placeholder, wired in a later phase */}
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-2 opacity-60">
          <Search size={15} strokeWidth={1.75} className="text-ink-faint" />
          <span className="text-[12.5px] text-ink-faint">Cari di SAKALA</span>
        </div>
      </div>

      <SystemStatus school={school} academicYear={academicYear} />

      {/* Admin Human Identity — placeholder pending Premium Avatar System */}
      <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface py-1 pl-1 pr-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated text-ink-muted">
          <User size={13} strokeWidth={1.75} />
        </div>
        <span className="text-[12.5px] text-ink-muted">Admin</span>
      </div>
    </header>
  );
}
