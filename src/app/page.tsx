import Link from "next/link";
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
      ready: teachers.some((t) => t.status === "active"),
      href: "/guru",
      count: teachers.length,
      builtYet: true,
    },
    {
      label: "Data mata pelajaran",
      ready: subjects.some((s) => s.status === "active"),
      href: "/mapel",
      count: subjects.length,
      builtYet: true,
    },
    {
      label: "Data kelas",
      ready: classes.some((c) => c.status === "active"),
      href: "/kelas",
      count: classes.length,
      builtYet: true,
    },
    {
      label: "Beban mengajar",
      ready: assignments.some((a) => a.status === "active"),
      href: "/beban-mengajar",
      count: assignments.length,
      builtYet: true,
    },
    {
      label: "Struktur waktu",
      ready: timeSlots.some((s) => s.status === "active"),
      href: "/jadwal/struktur-waktu",
      count: timeSlots.length,
      builtYet: true,
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-[10.5px] font-medium tracking-wide text-ink-faint">
        TAHUN AJARAN {academicYear.label}
      </p>
      <h1 className="mt-1 text-[22px] font-semibold text-ink">Beranda</h1>

      <div className="mt-8 rounded-2xl border border-hairline bg-surface p-5">
        <h2 className="text-[13.5px] font-medium text-ink">
          Kesiapan data
        </h2>
        <ul className="mt-3 space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-[13px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  item.ready ? "bg-status-ready" : "bg-status-incomplete"
                }`}
              />
              {item.builtYet ? (
                <Link href={item.href} className="text-ink-muted hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink-muted">{item.label}</span>
              )}
              {item.builtYet ? (
                <span className="text-[11px] text-ink-faint">
                  · {item.count} data
                </span>
              ) : (
                <span className="text-[11px] text-ink-faint">
                  · modul segera dibangun
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <IssueList issues={issues} />

      <div className="mt-4 rounded-2xl border border-hairline bg-surface p-5">
        <h2 className="text-[13.5px] font-medium text-ink">Jadwal</h2>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          {readyForSchedule
            ? "Data pengajaran sudah lengkap dan konsisten — kanvas jadwal & Scheduling Engine belum dibangun, menyusul fase berikutnya."
            : "Belum dapat dibuat — lengkapi data guru, mapel, kelas, beban mengajar, dan struktur waktu terlebih dahulu."}
        </p>
      </div>
    </div>
  );
}
