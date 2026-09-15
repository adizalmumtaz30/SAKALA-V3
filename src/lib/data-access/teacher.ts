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
