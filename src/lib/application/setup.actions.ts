"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SetupFormState {
  error?: string;
}

export async function createSchoolAction(
  _prev: SetupFormState,
  formData: FormData,
): Promise<SetupFormState> {
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  if (!schoolName) {
    return { error: "Nama sekolah wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("school").insert({
    school_name: schoolName,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function createAcademicYearAction(
  _prev: SetupFormState,
  formData: FormData,
): Promise<SetupFormState> {
  const schoolId = String(formData.get("schoolId") ?? "");
  const startYear = Number(formData.get("startYear"));

  if (!schoolId || !Number.isInteger(startYear)) {
    return { error: "Data tahun ajaran belum lengkap." };
  }

  const endYear = startYear + 1;
  const label = `${startYear}/${endYear}`;

  const supabase = await createClient();
  const { error } = await supabase.from("academic_year").insert({
    school_id: schoolId,
    start_year: startYear,
    end_year: endYear,
    label,
    lifecycle: "active",
    is_workspace_selected: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
