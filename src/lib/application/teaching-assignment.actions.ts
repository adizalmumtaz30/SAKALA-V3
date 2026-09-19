"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTeachingAssignmentsBulk, listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { recordHistory } from "@/lib/data-access/history";
import { createBebanMengajarSchema } from "@/lib/validation/teaching-assignment.schema";

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
  const parsed = createBebanMengajarSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
    teacherId: formData.get("teacherId"),
    subjectId: formData.get("subjectId"),
    classIds: formData.getAll("classIds"),
    targetJp: formData.get("targetJp"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data belum valid." };
  }

  const { academicYearId, teacherId, subjectId, classIds, targetJp } = parsed.data;

  const supabase = await createClient();
  const { inserted } = await createTeachingAssignmentsBulk(supabase, {
    academicYearId,
    teacherId,
    subjectId,
    classIds,
    targetJp,
  });

  await recordHistory(supabase, {
    academicYearId,
    entityType: "beban_mengajar",
    entityId: null,
    action: "create",
    summary: `${inserted} beban mengajar ditambahkan (${targetJp} JP/minggu, ${classIds.length} kelas)`,
  });

  revalidatePath("/beban-mengajar");
  return { success: `${inserted} beban mengajar ditambahkan` };
}


export async function deleteBebanMengajarAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Beban mengajar tidak ditemukan." };

  const supabase = await createClient();
  const { data: assignmentRow, error: fetchError } = await supabase
    .from("teaching_assignment")
    .select("academic_year_id")
    .eq("id", id)
    .single();

  if (fetchError || !assignmentRow) return { error: "Beban mengajar tidak ditemukan." };

  const assignments = await listTeachingAssignmentsForYear(supabase, assignmentRow.academic_year_id);
  const assignment = assignments.find((item) => item.id === id);
  if (!assignment) return { error: "Beban mengajar tidak ditemukan." };

  const { error } = await supabase
    .from("teaching_assignment")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  await recordHistory(supabase, {
    academicYearId: assignment.academicYearId,
    entityType: "beban_mengajar",
    entityId: id,
    action: "delete",
    summary: `Beban mengajar ${assignment.teacherName} — ${assignment.subjectName} — ${assignment.className} (${assignment.targetJp} JP/minggu) dihapus`,
  });

  revalidatePath("/beban-mengajar");
  revalidatePath("/jadwal");
  revalidatePath("/");
  return { success: "Beban mengajar dihapus." };
}
export async function toggleBebanMengajarStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const nextStatus = toggleNextStatus(currentStatus);
  const supabase = await createClient();
  const { data } = await supabase
    .from("teaching_assignment")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("academic_year_id")
    .single();

  await recordHistory(supabase, {
    academicYearId: data?.academic_year_id ?? null,
    entityType: "beban_mengajar",
    entityId: id,
    action: "toggle_status",
    summary: `Beban mengajar diubah menjadi ${nextStatus === "active" ? "aktif" : "nonaktif"}`,
  });

  revalidatePath("/beban-mengajar");
}
