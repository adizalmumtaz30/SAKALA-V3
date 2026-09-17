import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/domain/attendance";

interface AttendanceRow {
  id: string;
  academic_year_id: string;
  teacher_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  teacher: { name: string } | null;
}

function toDomain(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    teacherId: row.teacher_id,
    date: row.date,
    status: row.status,
    note: row.note,
    teacherName: row.teacher?.name ?? "(guru tidak ditemukan)",
  };
}

export async function listAttendanceForDate(
  supabase: SupabaseClient,
  academicYearId: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, teacher:teacher_id(name)")
    .eq("academic_year_id", academicYearId)
    .eq("date", date);

  if (error) throw error;
  return (data as unknown as AttendanceRow[]).map(toDomain);
}

export async function upsertAttendance(
  supabase: SupabaseClient,
  input: {
    academicYearId: string;
    teacherId: string;
    date: string;
    status: AttendanceStatus;
    note: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("attendance").upsert(
    {
      academic_year_id: input.academicYearId,
      teacher_id: input.teacherId,
      date: input.date,
      status: input.status,
      note: input.note,
    },
    { onConflict: "academic_year_id,teacher_id,date" },
  );
  if (error) throw error;
}
