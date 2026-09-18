"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPrimarySchool } from "@/lib/data-access/school";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { recordHistory } from "@/lib/data-access/history";
import { listSubjects, updateSubjectColor } from "@/lib/data-access/subject";
import { nextAvailableColorKey, getIdentityColor } from "@/lib/domain/identity-color";

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

  const { data, error } = await supabase
    .from("teacher")
    .insert({
      school_id: school?.id ?? null,
      name,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "guru",
    entityId: data?.id ?? null,
    action: "create",
    summary: `Guru ${name} ditambahkan`,
  });

  revalidatePath("/guru");
  return emptyState;
}

export async function toggleTeacherStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const nextStatus = toggleNextStatus(currentStatus);
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("name")
    .single();

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "guru",
    entityId: id,
    action: "toggle_status",
    summary: `Guru ${data?.name ?? ""} diubah menjadi ${nextStatus === "active" ? "aktif" : "nonaktif"}`,
  });

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

  // Identitas warna diberikan otomatis dari slot yang belum terpakai
  // (Bagian E.1.2) — operator tidak perlu memilih warna saat menambah data,
  // tapi tetap bisa menggantinya nanti.
  const existingSubjects = await listSubjects(supabase);
  const colorKey = nextAvailableColorKey(existingSubjects.map((s) => s.colorKey));

  const { data, error } = await supabase
    .from("subject")
    .insert({
      school_id: school?.id ?? null,
      name,
      status: "active",
      color_key: colorKey,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "mapel",
    entityId: data?.id ?? null,
    action: "create",
    summary: `Mata pelajaran ${name} ditambahkan`,
  });

  revalidatePath("/mapel");
  return emptyState;
}

export async function toggleSubjectStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const nextStatus = toggleNextStatus(currentStatus);
  const supabase = await createClient();
  const { data } = await supabase
    .from("subject")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("name")
    .single();

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "mapel",
    entityId: id,
    action: "toggle_status",
    summary: `Mata pelajaran ${data?.name ?? ""} diubah menjadi ${nextStatus === "active" ? "aktif" : "nonaktif"}`,
  });

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
  const { data, error } = await supabase
    .from("class")
    .insert({
      academic_year_id: academicYearId,
      name,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordHistory(supabase, {
    academicYearId,
    entityType: "kelas",
    entityId: data?.id ?? null,
    action: "create",
    summary: `Kelas ${name} ditambahkan`,
  });

  revalidatePath("/kelas");
  return emptyState;
}

export async function toggleClassStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const nextStatus = toggleNextStatus(currentStatus);
  const supabase = await createClient();
  const { data } = await supabase
    .from("class")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("name, academic_year_id")
    .single();

  await recordHistory(supabase, {
    academicYearId: data?.academic_year_id ?? null,
    entityType: "kelas",
    entityId: id,
    action: "toggle_status",
    summary: `Kelas ${data?.name ?? ""} diubah menjadi ${nextStatus === "active" ? "aktif" : "nonaktif"}`,
  });

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

  const { data, error } = await supabase
    .from("room")
    .insert({
      school_id: school?.id ?? null,
      name,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "ruang",
    entityId: data?.id ?? null,
    action: "create",
    summary: `Ruang ${name} ditambahkan`,
  });

  revalidatePath("/ruang");
  return emptyState;
}

export async function toggleRoomStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const currentStatus = String(formData.get("status"));
  const nextStatus = toggleNextStatus(currentStatus);
  const supabase = await createClient();
  const { data } = await supabase
    .from("room")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("name")
    .single();

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "ruang",
    entityId: id,
    action: "toggle_status",
    summary: `Ruang ${data?.name ?? ""} diubah menjadi ${nextStatus === "active" ? "aktif" : "nonaktif"}`,
  });

  revalidatePath("/ruang");
}

export async function setSubjectColorAction(formData: FormData) {
  const id = String(formData.get("id"));
  const colorKey = String(formData.get("colorKey"));
  if (!id || !getIdentityColor(colorKey)) return;

  const supabase = await createClient();
  await updateSubjectColor(supabase, { id, colorKey });

  const { data } = await supabase
    .from("subject")
    .select("name")
    .eq("id", id)
    .single();
  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: "mapel",
    entityId: id,
    action: "set_color",
    summary: `Warna identitas ${data?.name ?? ""} diubah ke ${getIdentityColor(colorKey)?.label}`,
  });

  revalidatePath("/mapel");
  revalidatePath("/jadwal");
}
