import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import type { School } from "@/lib/domain/school";
import type { AcademicYear } from "@/lib/domain/academic-year";

interface AppShellProps {
  school: School | null;
  academicYear: AcademicYear | null;
  children: ReactNode;
}

export function AppShell({ school, academicYear, children }: AppShellProps) {
  return (
    <div className="flex h-dvh bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar school={school} academicYear={academicYear} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
