import type { SupabaseClient } from "@supabase/supabase-js";
import type { Day, TimeSlot, TimeSlotType } from "@/lib/domain/time-structure";

interface TimeSlotRow {
  id: string;
  academic_year_id: string;
  day: Day;
  period_number: number;
  start_time: string;
  end_time: string;
  type: TimeSlotType;
  activity_label: string | null;
  status: "active" | "inactive";
}

function toDomain(row: TimeSlotRow): TimeSlot {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    day: row.day,
    periodNumber: row.period_number,
    startTime: row.start_time,
    endTime: row.end_time,
    type: row.type,
    activityLabel: row.activity_label,
    status: row.status,
  };
}

export async function listTimeStructureForYear(
  supabase: SupabaseClient,
  academicYearId: string,
): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from("time_structure")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("day", { ascending: true })
    .order("period_number", { ascending: true });

  if (error) throw error;
  return (data as TimeSlotRow[]).map(toDomain);
}

/**
 * Quick Setting (Bagian 29, LOCKED): the operator should not have to create
 * slots one by one when the pattern is the same across days. This inserts a
 * uniform MENGAJAR grid for the selected days; the operator then marks
 * exceptions (istirahat/kegiatan/nonaktif) on top of it.
 *
 * Refuses to run if any slot already exists for the year — regenerating
 * blind would silently discard exceptions the operator already set
 * (Bagian 107: no silent damage).
 */
export async function generateTimeStructure(
  supabase: SupabaseClient,
  input: {
    academicYearId: string;
    days: Day[];
    periodCount: number;
    startTime: string; // "HH:MM"
    durationMinutes: number;
  },
): Promise<{ inserted: number }> {
  const { count, error: countError } = await supabase
    .from("time_structure")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", input.academicYearId);

  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(
      "Struktur waktu sudah ada untuk tahun ajaran ini. Ubah slot satu per satu, bukan buat ulang dari nol.",
    );
  }

  const [startH, startM] = input.startTime.split(":").map(Number);
  const rows: Record<string, unknown>[] = [];

  for (const day of input.days) {
    let cursorMinutes = startH * 60 + startM;
    for (let period = 1; period <= input.periodCount; period++) {
      const start = cursorMinutes;
      const end = cursorMinutes + input.durationMinutes;
      rows.push({
        academic_year_id: input.academicYearId,
        day,
        period_number: period,
        start_time: minutesToTime(start),
        end_time: minutesToTime(end),
        type: "mengajar",
      });
      cursorMinutes = end;
    }
  }

  const { data, error } = await supabase
    .from("time_structure")
    .insert(rows)
    .select("id");

  if (error) throw error;
  return { inserted: data?.length ?? 0 };
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export async function updateTimeSlot(
  supabase: SupabaseClient,
  input: {
    id: string;
    type: TimeSlotType;
    activityLabel: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("time_structure")
    .update({
      type: input.type,
      activity_label: input.type === "kegiatan" ? input.activityLabel : null,
    })
    .eq("id", input.id);

  if (error) throw error;
}
