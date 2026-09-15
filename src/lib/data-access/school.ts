import type { SupabaseClient } from "@supabase/supabase-js";
import type { School } from "@/lib/domain/school";

interface SchoolRow {
  id: string;
  school_name: string;
  short_name: string | null;
  address: string | null;
  school_code: string | null;
  logo_url: string | null;
  status: "active" | "inactive";
}

function toDomain(row: SchoolRow): School {
  return {
    id: row.id,
    schoolName: row.school_name,
    shortName: row.short_name,
    address: row.address,
    schoolCode: row.school_code,
    logoUrl: row.logo_url,
    status: row.status,
  };
}

export async function getPrimarySchool(
  supabase: SupabaseClient,
): Promise<School | null> {
  const { data, error } = await supabase
    .from("school")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? toDomain(data as SchoolRow) : null;
}
