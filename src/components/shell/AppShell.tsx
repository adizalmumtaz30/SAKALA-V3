import type { ReactNode } from "react";
import { MobileSidebar, Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { MegaMendung } from "@/components/shell/MegaMendung";
import type { School } from "@/lib/domain/school";
import type { AcademicYear } from "@/lib/domain/academic-year";

interface AppShellProps {
  school: School | null;
  academicYear: AcademicYear | null;
  academicYears: AcademicYear[];
  children: ReactNode;
}

export function AppShell({
  school,
  academicYear,
  academicYears,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-dvh bg-canvas">
      <Sidebar />\n      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar school={school} academicYear={academicYear} academicYears={academicYears} />
        <main className="relative flex-1 overflow-y-auto">
          {/* Area teks: opasitas 4.5% — motif kalah prioritas dari
              keterbacaan (Bagian E.1.7, syarat mutlak). */}
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <MegaMendung variant="content" />
          </div>
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
