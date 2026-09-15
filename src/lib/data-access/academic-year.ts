import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcademicYear } from "@/lib/domain/academic-year";

interface AcademicYearRow {
  id: string;
  school_id: string;
  start_year: number;
  end_year: number;
  label: string;
  start_date: string | null;
  end_date: string | null;
  lifecycle: "draft" | "active" | "archived";
  is_workspace_selected: boolean;
}

function toDomain(row: AcademicYearRow): AcademicYear {
  return {
    id: row.id,
    schoolId: row.school_id,
    startYear: row.start_year,
    endYear: row.end_year,
    label: row.label,
    startDate: row.start_date,
    endDate: row.end_date,
    lifecycle: row.lifecycle,
    isWorkspaceSelected: row.is_workspace_selected,
  };
}

/** The single academic year currently selected as workspace context (if any). */
export async function getWorkspaceAcademicYear(
  supabase: SupabaseClient,
): Promise<AcademicYear | null> {
  const { data, error } = await supabase
    .from("academic_year")
    .select("*")
    .eq("is_workspace_selected", true)
    .maybeSingle();

  if (error) throw error;
  return data ? toDomain(data as AcademicYearRow) : null;
}

export async function listAcademicYears(
  supabase: SupabaseClient,
): Promise<AcademicYear[]> {
  const { data, error } = await supabase
    .from("academic_year")
    .select("*")
    .order("start_year", { ascending: false });

  if (error) throw error;
  return (data as AcademicYearRow[]).map(toDomain);
}
