import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subject } from "@/lib/domain/subject";

interface SubjectRow {
  id: string;
  code: string | null;
  name: string;
  short_name: string | null;
  category: string | null;
  status: "active" | "inactive";
  notes: string | null;
  color_key: string | null;
}

function toDomain(row: SubjectRow): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    shortName: row.short_name,
    category: row.category,
    status: row.status,
    notes: row.notes,
    colorKey: row.color_key,
  };
}

export async function listSubjects(
  supabase: SupabaseClient,
): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subject")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as SubjectRow[]).map(toDomain);
}

export async function updateSubjectColor(
  supabase: SupabaseClient,
  input: { id: string; colorKey: string },
): Promise<void> {
  const { error } = await supabase
    .from("subject")
    .update({ color_key: input.colorKey })
    .eq("id", input.id);
  if (error) throw error;
}
