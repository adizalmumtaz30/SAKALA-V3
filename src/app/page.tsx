import Link from "next/link";
import { Clock } from "lucide-react";
import {
  IconGuru,
  IconMapel,
  IconKelas,
  IconBebanMengajar,
} from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getPrimarySchool } from "@/lib/data-access/school";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachers } from "@/lib/data-access/teacher";
import { listSubjects } from "@/lib/data-access/subject";
import { listClassesForYear } from "@/lib/data-access/class";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listTimeStructureForYear } from "@/lib/data-access/time-structure";
import { computeDiagnosticIssues } from "@/lib/application/diagnostics";
import { IssueList } from "@/components/ui/IssueList";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CreateSchoolForm,
  CreateAcademicYearForm,
} from "@/components/onboarding/SetupForm";

export default async function BerandaPage() {
  const supabase = await createClient();
  const school = await getPrimarySchool(supabase);
  const academicYear = school ? await getWorkspaceAcademicYear(supabase) : null;

  if (!school) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">
            Selamat datang di SAKALA
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">
            Mulai dengan melengkapi profil sekolah.
          </p>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <CreateSchoolForm />
        </div>
      </div>
    );
  }

  if (!academicYear) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">
            {school.schoolName}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">
            Aktifkan tahun ajaran untuk mulai bekerja.
          </p>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <CreateAcademicYearForm schoolId={school.id} />
        </div>
      </div>
    );
  }

  const [teachers, subjects, classes, assignments, timeSlots] = await Promise.all([
    listTeachers(supabase),
    listSubjects(supabase),
    listClassesForYear(supabase, academicYear.id),
    listTeachingAssignmentsForYear(supabase, academicYear.id),
    listTimeStructureForYear(supabase, academicYear.id),
  ]);

  const checklist = [
    {
      label: "Data guru",
      icon: IconGuru,
      ready: teachers.some((t) => t.status === "active"),
      href: "/guru",
      count: teachers.length,
    },
    {
      label: "Data mata pelajaran",
      icon: IconMapel,
      ready: subjects.some((s) => s.status === "active"),
      href: "/mapel",
      count: subjects.length,
    },
    {
      label: "Data kelas",
      icon: IconKelas,
      ready: classes.some((c) => c.status === "active"),
      href: "/kelas",
      count: classes.length,
    },
    {
      label: "Beban mengajar",
      icon: IconBebanMengajar,
      ready: assignments.some((a) => a.status === "active"),
      href: "/beban-mengajar",
      count: assignments.length,
    },
    {
      label: "Struktur waktu",
      icon: Clock,
      ready: timeSlots.some((s) => s.status === "active"),
      href: "/jadwal/struktur-waktu",
      count: timeSlots.length,
    },
  ];

  const issues = computeDiagnosticIssues({
    teachers,
    subjects,
    classes,
    assignments,
    timeSlots,
  });
  const hasBlockingIssue = issues.some((i) => i.severity === "blocked");
  const readyForSchedule = assignments.length > 0 && !hasBlockingIssue;

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-10">
      {/* Atmospheric heritage layer — discovered, not displayed */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 opacity-[0.05]"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-champagne), transparent 70%)",
        }}
      />

      <div className="relative">
        <PageHeader kicker={`TAHUN AJARAN ${academicYear.label}`} title="Beranda" />

        <div className="mt-8 rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            Kesiapan data
          </h2>
          <ul className="mt-3 space-y-1">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-elevated"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        item.ready ? "bg-status-ready" : "bg-status-incomplete"
                      }`}
                    />
                    <Icon size={14} strokeWidth={1.75} className="text-ink-faint" />
                    <span className="text-[13px] text-ink-muted">
                      {item.label}
                    </span>
                    <span className="ml-auto text-[15px] font-semibold tabular-nums text-ink">
                      {item.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <IssueList issues={issues} />

        <div className="mt-4 rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                readyForSchedule ? "bg-status-ready" : "bg-status-incomplete"
              }`}
            />
            <h2 className="text-[13.5px] font-medium text-ink">Jadwal</h2>
          </div>
          <p className="mt-1.5 text-[13px] text-ink-muted">
            {readyForSchedule
              ? "Data pengajaran sudah lengkap dan konsisten — kanvas jadwal & Scheduling Engine belum dibangun, menyusul fase berikutnya."
              : "Belum dapat dibuat — lengkapi data guru, mapel, kelas, beban mengajar, dan struktur waktu terlebih dahulu."}
          </p>
        </div>
      </div>
    </div>
  );
}
