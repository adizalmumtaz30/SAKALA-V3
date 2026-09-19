import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleEntry, ScheduleSource } from "@/lib/domain/schedule";

interface ScheduleEntryRow {
  id: string;
  academic_year_id: string;
  teaching_assignment_id: string;
  room_id: string | null;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  day: string;
  period_number: number;
  source: ScheduleSource;
  locked: boolean;
  teacher: { name: string } | null;
  subject: { name: string; color_key: string | null } | null;
  class: { name: string } | null;
  room: { name: string } | null;
}

const SELECT = `
  *,
  teacher:teacher_id(name),
  subject:subject_id(name, color_key),
  class:class_id(name),
  room:room_id(name)
`;

function toDomain(row: ScheduleEntryRow): ScheduleEntry {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    teachingAssignmentId: row.teaching_assignment_id,
    roomId: row.room_id,
    teacherId: row.teacher_id,
    subjectId: row.subject_id,
    classId: row.class_id,
    day: row.day,
    periodNumber: row.period_number,
    source: row.source,
    locked: row.locked,
    teacherName: row.teacher?.name ?? "(guru tidak ditemukan)",
    subjectName: row.subject?.name ?? "(mapel tidak ditemukan)",
    subjectColorKey: row.subject?.color_key ?? null,
    className: row.class?.name ?? "(kelas tidak ditemukan)",
    roomName: row.room?.name ?? null,
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



/** Kode error Postgres untuk pelanggaran UNIQUE constraint. */
const UNIQUE_VIOLATION = "23505";

export type ScheduleWriteResult =
  | { ok: true }
  | { ok: false; clash: "teacher" | "class" | "duplicate" | "unknown" };

export interface ScheduleEntryInput {
  academicYearId: string;
  teachingAssignmentId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  day: string;
  periodNumber: number;
  roomId: string | null;
}

/**
 * Menyimpan beberapa JP sekaligus dalam satu INSERT.
 * Karena satu statement INSERT bersifat atomik di Postgres, jika salah satu
 * slot bentrok maka seluruh rentetan JP tidak jadi tersimpan sebagian.
 */
export async function createScheduleEntries(
  supabase: SupabaseClient,
  inputs: ScheduleEntryInput[],
): Promise<ScheduleWriteResult> {
  if (inputs.length === 0) return { ok: false, clash: "unknown" };

  const { error } = await supabase.from("schedule_entry").insert(
    inputs.map((input) => ({
      academic_year_id: input.academicYearId,
      teaching_assignment_id: input.teachingAssignmentId,
      teacher_id: input.teacherId,
      subject_id: input.subjectId,
      class_id: input.classId,
      day: input.day,
      period_number: input.periodNumber,
      room_id: input.roomId,
      source: "manual",
      locked: true,
    })),
  );

  if (!error) return { ok: true };
  if (error.code === UNIQUE_VIOLATION) {
    if (error.message.includes("no_teacher_clash")) return { ok: false, clash: "teacher" };
    if (error.message.includes("no_class_clash")) return { ok: false, clash: "class" };
    return { ok: false, clash: "duplicate" };
  }
  throw error;
}

/** Kompatibilitas untuk pemanggil yang hanya menempatkan satu JP. */
export async function createScheduleEntry(
  supabase: SupabaseClient,
  input: ScheduleEntryInput,
): Promise<ScheduleWriteResult> {
  return createScheduleEntries(supabase, [input]);
}

export async function deleteScheduleEntry(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("schedule_entry").delete().eq("id", id);
  if (error) throw error;
}

/** Pindah = ganti hari/jam ke-. Dipakai oleh aksi "Pindah jam". */
export async function moveScheduleEntry(
  supabase: SupabaseClient,
  id: string,
  target: { day: string; periodNumber: number },
): Promise<ScheduleWriteResult> {
  const { error } = await supabase
    .from("schedule_entry")
    .update({
      day: target.day,
      period_number: target.periodNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) return { ok: true };
  if (error.code === UNIQUE_VIOLATION) {
    if (error.message.includes("no_teacher_clash")) return { ok: false, clash: "teacher" };
    if (error.message.includes("no_class_clash")) return { ok: false, clash: "class" };
    return { ok: false, clash: "duplicate" };
  }
  throw error;
}
