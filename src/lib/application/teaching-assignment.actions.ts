"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTeachingAssignmentsBulk } from "@/lib/data-access/teaching-assignment";

export interface FormState {
  error?: string;
  success?: string;
}

function toggleNextStatus(current: string): "active" | "inactive" {
  return current === "active" ? "inactive" : "active";
}

/**
 * One-input model (Bagian 17-18, LOCKED): Guru + Mapel + several Kelas +
 * one Target JP creates one Beban Mengajar row per Kelas in a single save.
 */
export async function createBebanMengajarAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const classIds = formData.getAll("classIds").map(String);
  const targetJp = Number(formData.get("targetJp"));

  if (!academicYearId) return { error: "Tahun ajaran belum aktif." };
  if (!teacherId) return { error: "Pilih guru terlebih dahulu." };
  if (!subjectId) return { error: "Pilih mata pelajaran terlebih dahulu." };
  if (classIds.length === 0) return { error: "Pilih minimal satu kelas." };
  if (!Number.isInteger(targetJp) || targetJp <= 0) {
    return { error: "JP / minggu harus berupa angka lebih dari 0." };
  }

  const supabase = await createClient();
  const { inserted } = await createTeachingAssignmentsBulk(supabase, {
    academicYearId,
    teacherId,
    subjectId,
    classIds,
    targetJp,
  });

  revalidatePath("/beban-mengajar");
  return { success: `${inserted} beban mengajar ditambahkan` };
}

export async function toggleBebanMengajarStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const supabase = await createClient();
  await supabase
    .from("teaching_assignment")
    .update({ status: toggleNextStatus(currentStatus) })
    .eq("id", id);
  revalidatePath("/beban-mengajar");
}
