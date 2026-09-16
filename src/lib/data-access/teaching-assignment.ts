import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";

interface TeachingAssignmentRow {
  id: string;
  academic_year_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  target_jp: number;
  status: "active" | "inactive";
  notes: string | null;
  teacher: { name: string } | null;
  subject: { name: string } | null;
  class: { name: string } | null;
}

function toDomain(row: TeachingAssignmentRow): TeachingAssignment {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    teacherId: row.teacher_id,
    subjectId: row.subject_id,
    classId: row.class_id,
    targetJp: row.target_jp,
    status: row.status,
    notes: row.notes,
    teacherName: row.teacher?.name ?? "(guru tidak ditemukan)",
    subjectName: row.subject?.name ?? "(mapel tidak ditemukan)",
    className: row.class?.name ?? "(kelas tidak ditemukan)",
  };
}

export async function listTeachingAssignmentsForYear(
  supabase: SupabaseClient,
  academicYearId: string,
): Promise<TeachingAssignment[]> {
  const { data, error } = await supabase
    .from("teaching_assignment")
    .select(
      "*, teacher:teacher_id(name), subject:subject_id(name), class:class_id(name)",
    )
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as TeachingAssignmentRow[]).map(toDomain);
}

/**
 * One-input model (Bagian 17-18, LOCKED): one Guru + one Mapel + several Kelas
 * + one Target JP creates several Beban Mengajar rows in a single save.
 */
export async function createTeachingAssignmentsBulk(
  supabase: SupabaseClient,
  input: {
    academicYearId: string;
    teacherId: string;
    subjectId: string;
    classIds: string[];
    targetJp: number;
  },
): Promise<{ inserted: number }> {
  const rows = input.classIds.map((classId) => ({
    academic_year_id: input.academicYearId,
    teacher_id: input.teacherId,
    subject_id: input.subjectId,
    class_id: classId,
    target_jp: input.targetJp,
  }));

  // Upsert on the natural unique key so re-submitting an overlapping selection
  // updates the target JP instead of failing (Bagian 50: copy conflicts should
  // never silently duplicate or error opaquely).
  const { data, error } = await supabase
    .from("teaching_assignment")
    .upsert(rows, {
      onConflict: "academic_year_id,teacher_id,subject_id,class_id",
    })
    .select("id");

  if (error) throw error;
  return { inserted: data?.length ?? 0 };
}
