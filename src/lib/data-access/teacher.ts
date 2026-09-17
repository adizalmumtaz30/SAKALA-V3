import type { SupabaseClient } from "@supabase/supabase-js";
import type { Teacher } from "@/lib/domain/teacher";

interface TeacherRow {
  id: string;
  teacher_code: string | null;
  employee_number: string | null;
  name: string;
  short_name: string | null;
  gender: "L" | "P" | null;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive";
  notes: string | null;
}

function toDomain(row: TeacherRow): Teacher {
  return {
    id: row.id,
    teacherCode: row.teacher_code,
    employeeNumber: row.employee_number,
    name: row.name,
    shortName: row.short_name,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    status: row.status,
    notes: row.notes,
  };
}

export async function listTeachers(
  supabase: SupabaseClient,
): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teacher")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as TeacherRow[]).map(toDomain);
}

/**
 * Import (Bagian 16, LOCKED): never silently overwrite official data. Names
 * already present (case-insensitive) are skipped, not duplicated or updated.
 */
export async function bulkImportTeachers(
  supabase: SupabaseClient,
  input: { schoolId: string | null; names: string[] },
): Promise<{ added: number; skipped: number }> {
  const existing = await listTeachers(supabase);
  const existingLower = new Set(existing.map((t) => t.name.trim().toLowerCase()));

  const toInsert = input.names.filter(
    (n) => !existingLower.has(n.trim().toLowerCase()),
  );
  const skipped = input.names.length - toInsert.length;

  if (toInsert.length === 0) return { added: 0, skipped };

  const { error } = await supabase.from("teacher").insert(
    toInsert.map((name) => ({
      school_id: input.schoolId,
      name: name.trim(),
      status: "active",
    })),
  );
  if (error) throw error;

  return { added: toInsert.length, skipped };
}
