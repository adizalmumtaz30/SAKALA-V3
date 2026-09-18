"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  generateTimeStructure,
  updateTimeSlot,
} from "@/lib/data-access/time-structure";
import { recordHistory } from "@/lib/data-access/history";
import type { Day, TimeSlotType } from "@/lib/domain/time-structure";

export interface FormState {
  error?: string;
  success?: string;
}

export async function generateTimeStructureAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const days = formData.getAll("days") as Day[];
  const periodCount = Number(formData.get("periodCount"));
  const startTime = String(formData.get("startTime") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes"));

  if (!academicYearId) return { error: "Tahun ajaran belum aktif." };
  if (days.length === 0) return { error: "Pilih minimal satu hari." };
  if (!Number.isInteger(periodCount) || periodCount <= 0) {
    return { error: "Jumlah jam pelajaran harus lebih dari 0." };
  }
  if (!startTime) return { error: "Jam mulai wajib diisi." };
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { error: "Durasi per JP harus lebih dari 0 menit." };
  }

  try {
    const supabase = await createClient();
    const { inserted } = await generateTimeStructure(supabase, {
      academicYearId,
      days,
      periodCount,
      startTime,
      durationMinutes,
    });
    await recordHistory(supabase, {
      academicYearId,
      entityType: "struktur_waktu",
      entityId: null,
      action: "create",
      summary: `Struktur waktu dibuat — ${inserted} slot (${days.length} hari, ${periodCount} jam)`,
    });
    revalidatePath("/jadwal/struktur-waktu");
    return { success: `${inserted} slot struktur waktu dibuat` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal membuat struktur waktu." };
  }
}

export async function updateTimeSlotAction(formData: FormData) {
  const id = String(formData.get("id"));
  const type = String(formData.get("type")) as TimeSlotType;
  const activityLabel = String(formData.get("activityLabel") ?? "").trim() || null;

  const supabase = await createClient();
  await updateTimeSlot(supabase, { id, type, activityLabel });

  const { data } = await supabase
    .from("time_structure")
    .select("academic_year_id, day, period_number")
    .eq("id", id)
    .single();

  await recordHistory(supabase, {
    academicYearId: data?.academic_year_id ?? null,
    entityType: "struktur_waktu",
    entityId: id,
    action: "update",
    summary: `Slot ${data?.day ?? ""} P${data?.period_number ?? "?"} diubah menjadi ${type}${activityLabel ? ` (${activityLabel})` : ""}`,
  });

  revalidatePath("/jadwal/struktur-waktu");
}
