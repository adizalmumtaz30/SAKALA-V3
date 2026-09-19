import Link from "next/link";
import { Clock, AlertTriangle, CalendarDays, Zap, UserPlus, Upload, ClipboardCheck, FileText, ArrowRight } from "lucide-react";
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
import { listScheduleEntriesForYear } from "@/lib/data-access/schedule";
import { computeDiagnosticIssues } from "@/lib/application/diagnostics";
import {
  CreateSchoolForm,
  CreateAcademicYearForm,
} from "@/components/onboarding/SetupForm";
import { ReadinessRing } from "@/components/dashboard/ReadinessRing";

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

  const [teachers, subjects, classes, assignments, timeSlots, scheduleEntries] = await Promise.all([
    listTeachers(supabase),
    listSubjects(supabase),
    listClassesForYear(supabase, academicYear.id),
    listTeachingAssignmentsForYear(supabase, academicYear.id),
    listTimeStructureForYear(supabase, academicYear.id),
    listScheduleEntriesForYear(supabase, academicYear.id).catch(() => []),
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
  const allChecklistReady = checklist.every((item) => item.ready);
  // "Siap untuk penjadwalan" = seluruh data minimum ada DAN tidak ada
  // masalah yang memblokir — dua syarat berbeda, dicek terpisah supaya
  // tidak pernah bilang "siap" padahal ada isu blocking yang belum
  // ditangani (pelajaran dari insiden V2: jangan pernah fabrikasi status).
  const systemReady = allChecklistReady && !hasBlockingIssue;
  const scheduleExists = scheduleEntries.length > 0;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-7 lg:px-9">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-ink">
          Beranda
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Command Center · Tahun Pelajaran {academicYear.label}
        </p>
      </div>

      {/* --- Kesiapan Sistem + Jadwal --- */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-hairline bg-surface-elevated p-6">
          <div className="flex items-start gap-4">
            <ReadinessRing ready={systemReady} />
            <div className="min-w-0 pt-1">
              <p className="text-[12px] text-ink-muted">Kesiapan Sistem</p>
              <p
                className={`mt-0.5 text-[19px] font-semibold tracking-[-0.01em] ${
                  systemReady ? "text-champagne" : "text-status-incomplete"
                }`}
              >
                {systemReady ? "SIAP UNTUK PENJADWALAN" : "BELUM SIAP DIJADWALKAN"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                {systemReady
                  ? "Semua data minimum penjadwalan telah lengkap dan siap digunakan."
                  : "Lengkapi data yang masih kosong di bawah ini sebelum mulai membuat jadwal."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-5 sm:grid-cols-5">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition-colors hover:bg-surface-focus"
                >
                  <span className="relative">
                    <Icon size={20} strokeWidth={1.6} className="text-ink-muted group-hover:text-ink" />
                    <span
                      className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-surface-elevated ${
                        item.ready ? "bg-status-ready" : "bg-status-incomplete"
                      }`}
                      aria-hidden
                    />
                  </span>
                  <span className="text-[16px] font-semibold text-ink">{item.count}</span>
                  <span className="text-[11px] leading-tight text-ink-faint">
                    {item.label}
                    <br />
                    {item.ready ? "terdaftar" : "kosong"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-hairline bg-surface-elevated p-6">
          <div className="flex items-center gap-2 text-ink-muted">
            <CalendarDays size={16} strokeWidth={1.75} />
            <span className="text-[12px] font-medium uppercase tracking-[0.04em]">Jadwal</span>
          </div>
          <p className="mt-3 text-[19px] font-semibold text-ink">
            {scheduleExists ? `${scheduleEntries.length} pelajaran terjadwal` : "Belum dibuat"}
          </p>
          <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">
            {systemReady
              ? scheduleExists
                ? "Kanvas Jadwal sudah mulai terisi. Lanjutkan menempatkan sisa pelajaran."
                : "Seluruh data minimum penjadwalan telah siap."
              : "Lengkapi Kesiapan Sistem di samping sebelum mulai membuat jadwal."}
          </p>
          <Link
            href="/jadwal"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-champagne to-champagne/70 px-4 py-2.5 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            {scheduleExists ? "Buka Jadwal" : "Buat Jadwal"}
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </section>
      </div>

      {/* --- Perlu Dicek --- */}
      {issues.length > 0 && (
        <section className="mt-4 rounded-2xl border border-hairline bg-surface-elevated p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} strokeWidth={1.75} className="text-status-attention" />
              <h2 className="text-[14px] font-medium text-ink">Perlu Dicek</h2>
            </div>
            <span className="text-[12px] text-ink-faint">{issues.length} item</span>
          </div>
          <div className="mt-3 space-y-2">
            {issues.map((issue, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    issue.severity === "blocked"
                      ? "bg-status-blocked/15 text-status-blocked"
                      : "bg-status-attention/15 text-status-attention"
                  }`}
                >
                  <AlertTriangle size={12} strokeWidth={2} />
                </span>
                <p className="min-w-0 flex-1 truncate text-[13px] text-ink">{issue.message}</p>
                <Link
                  href={issue.href}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-accent-teal hover:text-ink"
                >
                  {issue.actionLabel}
                  <ArrowRight size={12} strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- Aksi Cepat --- */}
      <section className="mt-4 rounded-2xl border border-hairline bg-surface-elevated p-6">
        <div className="flex items-center gap-2 text-ink-muted">
          <Zap size={16} strokeWidth={1.75} />
          <h2 className="text-[14px] font-medium text-ink">Aksi Cepat</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-ink-faint">Lakukan hal utama dengan cepat.</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { href: "/guru", label: "Tambah Guru", icon: UserPlus, highlight: false },
            { href: "/import", label: "Import Data", icon: Upload, highlight: false },
            { href: "/jadwal", label: scheduleExists ? "Buka Jadwal" : "Buat Jadwal", icon: CalendarDays, highlight: true },
            { href: "/absensi", label: "Absensi Hari Ini", icon: ClipboardCheck, highlight: false },
            { href: "/laporan", label: "Buat Laporan", icon: FileText, highlight: false },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col justify-between gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                action.highlight
                  ? "border-transparent bg-gradient-to-br from-champagne to-champagne/70 text-canvas"
                  : "border-hairline text-ink hover:border-hairline-strong hover:bg-surface-focus"
              }`}
            >
              <action.icon size={18} strokeWidth={1.75} />
              <span className="flex items-center justify-between text-[12.5px] font-medium">
                {action.label}
                <ArrowRight size={13} strokeWidth={2} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
