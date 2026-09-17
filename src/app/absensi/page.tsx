import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachers } from "@/lib/data-access/teacher";
import { listAttendanceForDate } from "@/lib/data-access/attendance";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DateNavigator } from "@/components/attendance/DateNavigator";
import { AttendanceRow } from "@/components/attendance/AttendanceRow";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayISO();

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

  const [teachers, records] = await Promise.all([
    listTeachers(supabase),
    listAttendanceForDate(supabase, academicYear.id, date),
  ]);
  const activeTeachers = teachers.filter((t) => t.status === "active");
  const byTeacher = new Map(records.map((r) => [r.teacherId, r]));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader
        kicker="ABSENSI"
        title="Absensi Guru"
        description="Independen dari jadwal — kehadiran guru tidak mengubah dan tidak ditentukan oleh jadwal mengajar."
        action={<DateNavigator date={date} />}
      />

      <div className="mt-6 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {activeTeachers.length === 0 && (
          <EmptyState
            icon={<CheckSquare size={16} strokeWidth={1.75} />}
            message="Belum ada guru aktif untuk dicatat kehadirannya."
          />
        )}
        {activeTeachers.map((teacher) => {
          const record = byTeacher.get(teacher.id);
          return (
            <AttendanceRow
              key={teacher.id}
              academicYearId={academicYear.id}
              date={date}
              teacherId={teacher.id}
              teacherName={teacher.name}
              current={record ? { status: record.status, note: record.note } : null}
            />
          );
        })}
      </div>
    </div>
  );
}
