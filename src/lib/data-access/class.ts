import type { SupabaseClient } from "@supabase/supabase-js";
import type { SchoolClass } from "@/lib/domain/class";

interface ClassRow {
  id: string;
  academic_year_id: string;
  grade: string | null;
  name: string;
  code: string | null;
  capacity: number | null;
  status: "active" | "inactive";
}

function toDomain(row: ClassRow): SchoolClass {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    grade: row.grade,
    name: row.name,
    code: row.code,
    capacity: row.capacity,
    status: row.status,
  };
}

export async function listClassesForYear(
  supabase: SupabaseClient,
  academicYearId: string,
): Promise<SchoolClass[]> {
  const { data, error } = await supabase
    .from("class")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as ClassRow[]).map(toDomain);
}
