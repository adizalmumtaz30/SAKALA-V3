"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPrimarySchool } from "@/lib/data-access/school";

export interface FormState {
  error?: string;
}

const emptyState: FormState = {};

function toggleNextStatus(current: string): "active" | "inactive" {
  return current === "active" ? "inactive" : "active";
}

// ---------------------------------------------------------------------------
// Guru (Teacher) — one-input model: only Nama is required (Bagian 18, LOCKED)
// ---------------------------------------------------------------------------

export async function createTeacherAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama guru wajib diisi." };

  const supabase = await createClient();
  const school = await getPrimarySchool(supabase);

  const { error } = await supabase.from("teacher").insert({
    school_id: school?.id ?? null,
    name,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/guru");
  return emptyState;
}

export async function toggleTeacherStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const supabase = await createClient();
  await supabase
    .from("teacher")
    .update({ status: toggleNextStatus(currentStatus) })
    .eq("id", id);
  revalidatePath("/guru");
}

// ---------------------------------------------------------------------------
// Mapel (Subject)
// ---------------------------------------------------------------------------

export async function createSubjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama mata pelajaran wajib diisi." };

  const supabase = await createClient();
  const school = await getPrimarySchool(supabase);

  const { error } = await supabase.from("subject").insert({
    school_id: school?.id ?? null,
    name,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/mapel");
  return emptyState;
}

export async function toggleSubjectStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const supabase = await createClient();
  await supabase
    .from("subject")
    .update({ status: toggleNextStatus(currentStatus) })
    .eq("id", id);
  revalidatePath("/mapel");
}

// ---------------------------------------------------------------------------
// Kelas (Class) — always scoped to the active workspace Academic Year
// ---------------------------------------------------------------------------

export async function createClassAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const academicYearId = String(formData.get("academicYearId") ?? "");

  if (!academicYearId) {
    return { error: "Tahun ajaran belum aktif." };
  }
  if (!name) return { error: "Nama kelas wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.from("class").insert({
    academic_year_id: academicYearId,
    name,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/kelas");
  return emptyState;
}

export async function toggleClassStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const supabase = await createClient();
  await supabase
    .from("class")
    .update({ status: toggleNextStatus(currentStatus) })
    .eq("id", id);
  revalidatePath("/kelas");
}

// ---------------------------------------------------------------------------
// Ruang (Room)
// ---------------------------------------------------------------------------

export async function createRoomAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama ruang wajib diisi." };

  const supabase = await createClient();
  const school = await getPrimarySchool(supabase);

  const { error } = await supabase.from("room").insert({
    school_id: school?.id ?? null,
    name,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/ruang");
  return emptyState;
}

export async function toggleRoomStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const supabase = await createClient();
  await supabase
    .from("room")
    .update({ status: toggleNextStatus(currentStatus) })
    .eq("id", id);
  revalidatePath("/ruang");
}
