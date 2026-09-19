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
import {
  CreateSchoolForm,
  CreateAcademicYearForm,
} from "@/components/onboarding/SetupForm";
import { DashboardHeroIllustration } from "@/components/dashboard/DashboardHeroIllustration";

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
  const systemState =
    !assignments.length || !timeSlots.length
      ? "missing"
      : hasBlockingIssue
        ? "warning"
        : "ready";

  return (
    <div className="dashboard-page mx-auto max-w-[1440px] px-5 py-6 sm:px-7 lg:px-9">
      <DashboardHeroIllustration
        state={systemState}
        schoolName={school.schoolName}
        academicYear={academicYear.label}
        teacherCount={teachers.length}
        subjectCount={subjects.length}
        classCount={classes.length}
        assignmentCount={assignments.length}
        timeSlotCount={timeSlots.length}
        issueCount={issues.length}
      />

      <div className="dashboard-below-grid">
        <section className="dashboard-support-panel" aria-labelledby="dashboard-check-title">
          <div className="dashboard-support-heading">
            <div>
              <p className="dashboard-support-eyebrow">KONTROL KESIAPAN</p>
              <h2 id="dashboard-check-title">Perlu Dicek</h2>
            </div>
            <span className="dashboard-support-count">{issues.length}</span>
          </div>
          <div className="dashboard-checklist">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="dashboard-check-item"
                >
                  <span
                    className={`dashboard-check-indicator dashboard-check-indicator--${item.ready ? "ready" : "pending"}`}
                    aria-hidden
                  />
                  <Icon size={15} strokeWidth={1.65} className="dashboard-check-icon" />
                  <span className="dashboard-check-label">{item.label}</span>
                  <span className="dashboard-check-value">{item.count}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="dashboard-support-panel" aria-labelledby="dashboard-schedule-title">
          <div className="dashboard-support-heading">
            <div>
              <p className="dashboard-support-eyebrow">STATUS OPERASIONAL</p>
              <h2 id="dashboard-schedule-title">Jadwal</h2>
            </div>
            <span className={`dashboard-operational-state dashboard-operational-state--${systemState}`}>
              {systemState === "ready" ? "Siap" : systemState === "warning" ? "Perlu Dicek" : "Belum Lengkap"}
            </span>
          </div>
          <p className="dashboard-support-copy">
            {readyForSchedule
              ? "Data pengajaran sudah lengkap dan konsisten. Kanvas jadwal dan Scheduling Engine akan menjadi tahap berikutnya."
              : "Lengkapi data guru, mapel, kelas, beban mengajar, dan struktur waktu sebelum memulai penjadwalan."}
          </p>
          <Link href="/jadwal" className="dashboard-support-link">
            Buka Jadwal <span aria-hidden>→</span>
          </Link>
        </section>

        <section className="dashboard-support-panel dashboard-support-panel--actions" aria-labelledby="dashboard-actions-title">
          <div className="dashboard-support-heading">
            <div>
              <p className="dashboard-support-eyebrow">AKSI CEPAT</p>
              <h2 id="dashboard-actions-title">Lanjutkan pekerjaan</h2>
            </div>
          </div>
          <div className="dashboard-action-links">
            <Link href="/guru" className="dashboard-action-link">Tambah Guru</Link>
            <Link href="/beban-mengajar" className="dashboard-action-link">Atur Beban</Link>
            <Link href="/jadwal/struktur-waktu" className="dashboard-action-link">Struktur Waktu</Link>
            <Link href="/import" className="dashboard-action-link">Import Data</Link>
          </div>
        </section>
      </div>

      <div className="dashboard-issues">
        <IssueList issues={issues} />
      </div>
    </div>
  );
}
