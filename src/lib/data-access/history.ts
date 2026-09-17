import type { SupabaseClient } from "@supabase/supabase-js";
import type { HistoryEntry } from "@/lib/domain/history";

interface HistoryRow {
  id: string;
  academic_year_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string;
  actor: string;
  created_at: string;
}

function toDomain(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    actor: row.actor,
    createdAt: row.created_at,
  };
}

/**
 * Fire-and-log: called from server actions right after a mutation succeeds.
 * Never throws into the caller — a history-logging failure must not roll
 * back or mask the real mutation's result.
 */
export async function recordHistory(
  supabase: SupabaseClient,
  input: {
    academicYearId: string | null;
    entityType: string;
    entityId: string | null;
    action: string;
    summary: string;
  },
): Promise<void> {
  try {
    await supabase.from("history_entry").insert({
      academic_year_id: input.academicYearId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      summary: input.summary,
    });
  } catch {
    // Logging failure is non-fatal — the underlying mutation already succeeded.
  }
}

export async function listHistory(
  supabase: SupabaseClient,
  academicYearId: string,
  limit = 50,
): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("history_entry")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as HistoryRow[]).map(toDomain);
}

export async function listHistoryForEntity(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  limit = 10,
): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("history_entry")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as HistoryRow[]).map(toDomain);
}
