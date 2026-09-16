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
  schoolId: string,
): Promise<AcademicYear[]> {
  const { data, error } = await supabase
    .from("academic_year")
    .select("*")
    .eq("school_id", schoolId)
    .order("start_year", { ascending: false });

  if (error) throw error;
  return (data as AcademicYearRow[]).map(toDomain);
}

/**
 * Context switch (Bagian 14, LOCKED): exactly one academic year per school
 * may be the workspace-selected context. Must clear the old selection
 * before setting the new one — the partial unique index forbids two rows
 * with is_workspace_selected = true at once.
 */
export async function switchWorkspaceAcademicYear(
  supabase: SupabaseClient,
  input: { schoolId: string; targetYearId: string },
): Promise<void> {
  const { error: clearError } = await supabase
    .from("academic_year")
    .update({ is_workspace_selected: false })
    .eq("school_id", input.schoolId)
    .eq("is_workspace_selected", true);
  if (clearError) throw clearError;

  const { error: setError } = await supabase
    .from("academic_year")
    .update({ is_workspace_selected: true })
    .eq("id", input.targetYearId);
  if (setError) throw setError;
}

/**
 * "Persiapkan Tahun Berikutnya" (Bagian 33-34): a new year starts as DRAFT
 * and is NOT the workspace context — preparing it never disrupts the
 * operator's current active year.
 */
export async function createDraftAcademicYear(
  supabase: SupabaseClient,
  input: { schoolId: string; startYear: number },
): Promise<void> {
  const endYear = input.startYear + 1;
  const { error } = await supabase.from("academic_year").insert({
    school_id: input.schoolId,
    start_year: input.startYear,
    end_year: endYear,
    label: `${input.startYear}/${endYear}`,
    lifecycle: "draft",
    is_workspace_selected: false,
  });
  if (error) throw error;
}
