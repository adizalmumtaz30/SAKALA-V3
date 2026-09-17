"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  switchWorkspaceAcademicYear,
  createDraftAcademicYear,
} from "@/lib/data-access/academic-year";
import { recordHistory } from "@/lib/data-access/history";

export interface FormState {
  error?: string;
}

export async function switchAcademicYearAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const targetYearId = String(formData.get("targetYearId") ?? "");
  if (!schoolId || !targetYearId) return;

  const supabase = await createClient();
  await switchWorkspaceAcademicYear(supabase, { schoolId, targetYearId });

  const { data } = await supabase
    .from("academic_year")
    .select("label")
    .eq("id", targetYearId)
    .single();
  await recordHistory(supabase, {
    academicYearId: targetYearId,
    entityType: "tahun_ajaran",
    entityId: targetYearId,
    action: "switch",
    summary: `Konteks workspace dipindahkan ke tahun ajaran ${data?.label ?? ""}`,
  });

  revalidatePath("/", "layout");
}

export async function createDraftAcademicYearAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const schoolId = String(formData.get("schoolId") ?? "");
  const startYear = Number(formData.get("startYear"));

  if (!schoolId) return { error: "Sekolah tidak ditemukan." };
  if (!Number.isInteger(startYear)) {
    return { error: "Tahun mulai harus berupa angka." };
  }

  try {
    const supabase = await createClient();
    await createDraftAcademicYear(supabase, { schoolId, startYear });
    revalidatePath("/", "layout");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal membuat tahun ajaran.",
    };
  }
}
