import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listAttendanceForRange } from "@/lib/data-access/attendance";
import {
  summarizeWorkloadByTeacher,
  summarizeWorkloadByClass,
  summarizeAttendanceByTeacher,
} from "@/lib/application/reports";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/domain/attendance";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function LaporanPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink"
        >
          Ke Beranda
        </Link>
      </div>
    );
  }

  const rangeStart = firstDayOfMonth();
  const rangeEnd = today();

  const [assignments, attendance] = await Promise.all([
    listTeachingAssignmentsForYear(supabase, academicYear.id),
    listAttendanceForRange(supabase, academicYear.id, rangeStart, rangeEnd),
  ]);

  const byTeacher = summarizeWorkloadByTeacher(assignments);
  const byClass = summarizeWorkloadByClass(assignments);
  const attendanceSummary = summarizeAttendanceByTeacher(attendance);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader
        kicker="LAPORAN"
        title="Laporan"
        description={`Tahun ajaran ${academicYear.label} — rekap ditarik langsung dari data yang ada, bukan file terpisah.`}
      />

      <div className="mt-6">
        <h2 className="text-[13px] font-medium text-ink">
          Rekap JTM per Guru
        </h2>
        <div className="mt-2 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {byTeacher.length === 0 ? (
            <EmptyState
              icon={<FileText size={16} strokeWidth={1.75} />}
              message="Belum ada beban mengajar untuk dihitung."
            />
          ) : (
            byTeacher.map((t) => (
              <div key={t.teacherId} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-ink">{t.teacherName}</span>
                <span className="text-[12px] text-ink-muted">
                  {t.totalJp} JP · {t.subjectCount} mapel · {t.classCount} kelas
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-[13px] font-medium text-ink">
          Rekap JTM per Kelas
        </h2>
        <div className="mt-2 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {byClass.length === 0 ? (
            <EmptyState
              icon={<FileText size={16} strokeWidth={1.75} />}
              message="Belum ada beban mengajar untuk dihitung."
            />
          ) : (
            byClass.map((c) => (
              <div key={c.classId} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-ink">{c.className}</span>
                <span className="text-[12px] text-ink-muted">
                  {c.totalJp} JP · {c.subjectCount} mapel
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-[13px] font-medium text-ink">
          Rekap Absensi Guru
        </h2>
        <p className="text-[11.5px] text-ink-faint">
          {rangeStart} – {rangeEnd}
        </p>
        <div className="mt-2 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {attendanceSummary.length === 0 ? (
            <EmptyState
              icon={<FileText size={16} strokeWidth={1.75} />}
              message="Belum ada catatan absensi pada rentang ini."
            />
          ) : (
            attendanceSummary.map((s) => (
              <div key={s.teacherId} className="px-4 py-2.5">
                <p className="text-[13px] text-ink">{s.teacherName}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">
                  {Object.entries(ATTENDANCE_STATUS_LABEL)
                    .map(([key, label]) => `${label} ${s.counts[key as keyof typeof s.counts]}`)
                    .join(" · ")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
