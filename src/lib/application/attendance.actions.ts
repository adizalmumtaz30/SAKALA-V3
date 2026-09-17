"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertAttendance } from "@/lib/data-access/attendance";
import type { AttendanceStatus } from "@/lib/domain/attendance";

export async function recordAttendanceAction(formData: FormData) {
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "") as AttendanceStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!academicYearId || !teacherId || !date || !status) return;

  const supabase = await createClient();
  await upsertAttendance(supabase, { academicYearId, teacherId, date, status, note });
  revalidatePath("/absensi");
}
