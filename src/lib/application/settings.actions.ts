"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateSchool } from "@/lib/data-access/school";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { recordHistory } from "@/lib/data-access/history";

export interface FormState {
  error?: string;
  success?: string;
}

export async function updateSchoolProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const schoolCode = String(formData.get("schoolCode") ?? "").trim() || null;

  if (!id) return { error: "Sekolah tidak ditemukan." };
  if (!schoolName) return { error: "Nama sekolah wajib diisi." };

  const supabase = await createClient();
  await updateSchool(supabase, { id, schoolName, shortName, address, schoolCode });

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "sekolah",
    entityId: id,
    action: "update",
    summary: `Profil sekolah diperbarui (${schoolName})`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: "Profil sekolah disimpan" };
}
