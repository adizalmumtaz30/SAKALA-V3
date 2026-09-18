import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleEntry } from "@/lib/domain/schedule";

interface ScheduleEntryRow {
  id: string;
  academic_year_id: string;
  time_slot_id: string;
  teaching_assignment_id: string;
  room_id: string | null;
  room: { name: string } | null;
  time_structure: { day: string; period_number: number } | null;
  teaching_assignment: {
    teacher_id: string;
    subject_id: string;
    class_id: string;
    teacher: { name: string } | null;
    subject: { name: string; color_key: string | null } | null;
    class: { name: string } | null;
  } | null;
}

const SELECT = `
  *,
  room:room_id(name),
  time_structure:time_slot_id(day, period_number),
  teaching_assignment:teaching_assignment_id(
    teacher_id, subject_id, class_id,
    teacher:teacher_id(name),
    subject:subject_id(name, color_key),
    class:class_id(name)
  )
`;

function toDomain(row: ScheduleEntryRow): ScheduleEntry {
  const ta = row.teaching_assignment;
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    timeSlotId: row.time_slot_id,
    teachingAssignmentId: row.teaching_assignment_id,
    roomId: row.room_id,
    teacherId: ta?.teacher_id ?? "",
    teacherName: ta?.teacher?.name ?? "(guru tidak ditemukan)",
    subjectId: ta?.subject_id ?? "",
    subjectName: ta?.subject?.name ?? "(mapel tidak ditemukan)",
    subjectColorKey: ta?.subject?.color_key ?? null,
    classId: ta?.class_id ?? "",
    className: ta?.class?.name ?? "(kelas tidak ditemukan)",
    roomName: row.room?.name ?? null,
    day: row.time_structure?.day ?? "",
    periodNumber: row.time_structure?.period_number ?? 0,
  };
}

export async function listScheduleEntriesForYear(
  supabase: SupabaseClient,
  academicYearId: string,
): Promise<ScheduleEntry[]> {
  const { data, error } = await supabase
    .from("schedule_entry")
    .select(SELECT)
    .eq("academic_year_id", academicYearId);

  if (error) throw error;
  return (data as unknown as ScheduleEntryRow[]).map(toDomain);
}

export async function createScheduleEntry(
  supabase: SupabaseClient,
  input: {
    academicYearId: string;
    timeSlotId: string;
    teachingAssignmentId: string;
    roomId: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("schedule_entry").insert({
    academic_year_id: input.academicYearId,
    time_slot_id: input.timeSlotId,
    teaching_assignment_id: input.teachingAssignmentId,
    room_id: input.roomId,
  });
  if (error) throw error;
}

export async function deleteScheduleEntry(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("schedule_entry").delete().eq("id", id);
  if (error) throw error;
}

/** Pindah = ganti slot. Dipakai oleh aksi "Pindah jam". */
export async function moveScheduleEntry(
  supabase: SupabaseClient,
  id: string,
  timeSlotId: string,
): Promise<void> {
  const { error } = await supabase
    .from("schedule_entry")
    .update({ time_slot_id: timeSlotId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
