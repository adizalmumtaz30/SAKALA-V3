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
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-[12px] text-ink-muted">{label}</span>
    </div>
  );
}

export function TopBar({ school, academicYear, academicYears }: TopBarProps) {
  return (
    <header className="relative flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-canvas px-4 md:gap-6 md:px-6">
      <button
        type="button"
        aria-label="Buka navigasi"
        className="rounded-lg p-2 text-ink-muted hover:text-ink md:hidden"
        onClick={() => window.dispatchEvent(new Event("sakala:open-mobile-nav"))}
      >
        <Menu size={19} strokeWidth={1.8} />
      </button>

      {/* School Identity */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-hairline-strong bg-surface text-[12px] font-medium text-ink-muted">
          {(school?.shortName ?? school?.schoolName ?? "S").slice(0, 1)}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="truncate text-[13px] font-medium text-ink md:max-w-none">
            {school?.schoolName ?? "Sekolah belum diatur"}
          </span>
          <span className="text-[10.5px] text-ink-faint">
            Operator Workspace
          </span>
        </div>
      </div>

      <div className="hidden h-6 w-px bg-hairline md:block" />

      {/* Academic Year Context */}
      <div className="hidden md:block">
        {school && (
        <AcademicContextTrigger
          schoolId={school.id}
          academicYear={academicYear}
          academicYears={academicYears}
        />
        )}
      </div>

      {/* Bagian F.3 — pintu masuk Command Palette (Ctrl/Cmd+K). */}
      <div className="min-w-0 flex flex-1 justify-center md:justify-center">
        <SearchTrigger />
      </div>

      <SystemStatus school={school} academicYear={academicYear} />

      {/* Admin Human Identity — placeholder pending Premium Avatar System */}
      <div className="hidden items-center gap-2 rounded-full border border-hairline bg-surface py-1 pl-1 pr-3 md:flex">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated text-ink-muted">
          <User size={13} strokeWidth={1.75} />
        </div>
        <span className="text-[12.5px] text-ink-muted">Admin</span>
      </div>
    </header>
  );
}
