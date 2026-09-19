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

// ---------------------------------------------------------------------------
// Ubah nama (Bagian V.1) — ✏️ per baris di Guru/Mapel/Kelas/Ruang.
//
// Sengaja hanya field "name" yang bisa diubah lewat sini: konsisten dengan
// model one-input yang sudah dipakai untuk membuat data (Bagian 18, LOCKED),
// dan "name" satu-satunya kolom yang pasti ada di keempat entitas. Field
// lain (NIP, kapasitas ruang, dst.) masih lewat form masing-masing bila
// nanti dibutuhkan — bukan dipaksa masuk ke satu form edit generik.
// ---------------------------------------------------------------------------

async function renameEntity(
  table: "teacher" | "subject" | "class" | "room",
  entityLabel: string,
  historyEntityType: string,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Data tidak ditemukan." };
  if (!name) return { error: `Nama ${entityLabel} wajib diisi.` };

  const supabase = await createClient();
  const { data: before } = await supabase.from(table).select("name").eq("id", id).single();

  const { error } = await supabase.from(table).update({ name }).eq("id", id);
  if (error) return { error: error.message };

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: historyEntityType,
    entityId: id,
    action: "update",
    summary:
      before?.name && before.name !== name
        ? `${entityLabel} "${before.name}" diganti nama jadi "${name}"`
        : `${entityLabel} "${name}" diperbarui`,
  });

  return emptyState;
}

export async function updateTeacherAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await renameEntity("teacher", "guru", "guru", formData);
  revalidatePath("/guru");
  return result;
}

export async function updateSubjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await renameEntity("subject", "mata pelajaran", "mapel", formData);
  revalidatePath("/mapel");
  revalidatePath("/jadwal");
  return result;
}

export async function updateClassAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await renameEntity("class", "kelas", "kelas", formData);
  revalidatePath("/kelas");
  revalidatePath("/jadwal");
  return result;
}

export async function updateRoomAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await renameEntity("room", "ruang", "ruang", formData);
  revalidatePath("/ruang");
  return result;
}

// ---------------------------------------------------------------------------
// Bagian VI.4 — Aksi massal (bulk).
//
// Menonaktifkan 15 guru di akhir tahun ajaran seharusnya bukan 15 kali
// hover->klik. Dipanggil LANGSUNG dari komponen klien (bukan lewat <form>
// biasa) karena sumber datanya array id dari state pilihan, bukan satu
// baris form.
//
// Sengaja arah eksplisit (aktifkan/nonaktifkan), BUKAN "toggle" massal:
// pilihan operator sering campur (sebagian aktif, sebagian nonaktif), dan
// men-toggle itu ambigu -- barisnya akan berakhir di status yang
// operator tidak duga. Satu ringkasan Riwayat per aksi (bukan per baris)
// supaya tidak membanjiri log.
// ---------------------------------------------------------------------------

export interface BulkResult {
  error?: string;
  success?: string;
}

async function bulkSetStatus(
  table: "teacher" | "subject" | "class" | "room",
  entityLabelPlural: string,
  historyEntityType: string,
  ids: string[],
  status: "active" | "inactive",
): Promise<BulkResult> {
  if (ids.length === 0) return { error: "Belum ada yang dipilih." };

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ status })
    .in("id", ids);

  if (error) return { error: error.message };

  const year = await getWorkspaceAcademicYear(supabase);
  await recordHistory(supabase, {
    academicYearId: year?.id ?? null,
    entityType: historyEntityType,
    entityId: null,
    action: status === "active" ? "bulk_activate" : "bulk_deactivate",
    summary: `${ids.length} ${entityLabelPlural} ${status === "active" ? "diaktifkan" : "dinonaktifkan"} sekaligus`,
  });

  const PATH_BY_ENTITY: Record<string, string> = {
    guru: "/guru",
    mapel: "/mapel",
    kelas: "/kelas",
    ruang: "/ruang",
  };
  revalidatePath(PATH_BY_ENTITY[historyEntityType]);
  if (historyEntityType === "mapel" || historyEntityType === "kelas") revalidatePath("/jadwal");

  return { success: `${ids.length} data ${status === "active" ? "diaktifkan" : "dinonaktifkan"}.` };
}

// §Bugfix runtime — sebelumnya dipanggil dari halaman lewat pembungkus
// panah `(ids) => bulkSetTeacherStatusAction(ids, "active")`. Itu MEMBUAT
// closure baru yang kehilangan status "Server Action"-nya (cuma
// referensi LANGSUNG ke fungsi ber-"use server" yang boleh lewat batas
// Server->Client). Efeknya: "Functions cannot be passed directly to
// Client Components" di runtime setiap buka /guru /mapel /kelas /ruang —
// lolos tsc & eslint karena ini aturan RSC, bukan aturan tipe. Diperbaiki
// dengan 8 fungsi literal (bukan 4 + parameter status) supaya halaman
// bisa meneruskan referensi fungsi apa adanya, tanpa pembungkus.
export async function bulkActivateTeacherAction(ids: string[]) {
  return bulkSetStatus("teacher", "guru", "guru", ids, "active");
}
export async function bulkDeactivateTeacherAction(ids: string[]) {
  return bulkSetStatus("teacher", "guru", "guru", ids, "inactive");
}
export async function bulkActivateSubjectAction(ids: string[]) {
  return bulkSetStatus("subject", "mata pelajaran", "mapel", ids, "active");
}
export async function bulkDeactivateSubjectAction(ids: string[]) {
  return bulkSetStatus("subject", "mata pelajaran", "mapel", ids, "inactive");
}
export async function bulkActivateClassAction(ids: string[]) {
  return bulkSetStatus("class", "kelas", "kelas", ids, "active");
}
export async function bulkDeactivateClassAction(ids: string[]) {
  return bulkSetStatus("class", "kelas", "kelas", ids, "inactive");
}
export async function bulkActivateRoomAction(ids: string[]) {
  return bulkSetStatus("room", "ruang", "ruang", ids, "active");
}
export async function bulkDeactivateRoomAction(ids: string[]) {
  return bulkSetStatus("room", "ruang", "ruang", ids, "inactive");
}
