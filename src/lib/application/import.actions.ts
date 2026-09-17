"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bulkImportTeachers } from "@/lib/data-access/teacher";
import { getPrimarySchool } from "@/lib/data-access/school";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { recordHistory } from "@/lib/data-access/history";

export interface ImportFormState {
  error?: string;
  success?: string;
}

export async function importTeachersAction(
  _prev: ImportFormState,
  formData: FormData,
): Promise<ImportFormState> {
  const namesRaw = String(formData.get("names") ?? "");
  const names = namesRaw
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return { error: "Tidak ada nama untuk diimpor." };
  }

  const supabase = await createClient();
  const school = await getPrimarySchool(supabase);
  const { added, skipped } = await bulkImportTeachers(supabase, {
    schoolId: school?.id ?? null,
    names,
  });

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "guru",
    entityId: null,
    action: "import",
    summary: `Import Guru: ${added} ditambahkan, ${skipped} dilewati (sudah ada)`,
  });

  revalidatePath("/guru");
  return {
    success: `${added} guru ditambahkan${skipped > 0 ? `, ${skipped} dilewati karena sudah ada` : ""}`,
  };
}
