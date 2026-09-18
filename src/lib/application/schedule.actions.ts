"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  listScheduleEntriesForYear,
  createScheduleEntry,
  deleteScheduleEntry,
  moveScheduleEntry,
} from "@/lib/data-access/schedule";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listRooms } from "@/lib/data-access/room";
import { listTimeStructureForYear } from "@/lib/data-access/time-structure";
import { recordHistory } from "@/lib/data-access/history";
import { findConflicts } from "@/lib/application/schedule-conflict";
import { DAY_LABEL, type Day } from "@/lib/domain/time-structure";

export interface ScheduleActionState {
  error?: string;
  /** Daftar bentrok dalam bahasa operator — ditampilkan apa adanya. */
  conflicts?: string[];
  success?: string;
}

/**
 * Menempatkan satu Beban Mengajar ke satu slot.
 *
 * Urutan sengaja: validasi DULU, simpan KEMUDIAN. Bentrok harus diketahui
 * sebelum commit, bukan setelah — ini aturan non-negotiable yang lahir dari
 * insiden nyata di V2.
 */
export async function assignScheduleAction(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const timeSlotId = String(formData.get("timeSlotId") ?? "");
  const teachingAssignmentId = String(formData.get("teachingAssignmentId") ?? "");
  const roomIdRaw = String(formData.get("roomId") ?? "");
  const roomId = roomIdRaw === "" ? null : roomIdRaw;

  if (!academicYearId || !timeSlotId || !teachingAssignmentId) {
    return { error: "Data belum lengkap — pilih mata pelajaran dulu." };
  }

  const supabase = await createClient();

  const [assignments, entries, rooms, slots] = await Promise.all([
    listTeachingAssignmentsForYear(supabase, academicYearId),
    listScheduleEntriesForYear(supabase, academicYearId),
    listRooms(supabase),
    listTimeStructureForYear(supabase, academicYearId),
  ]);

  const assignment = assignments.find((a) => a.id === teachingAssignmentId);
  if (!assignment) {
    return { error: "Beban mengajar tidak ditemukan." };
  }

  const slot = slots.find((s) => s.id === timeSlotId);
  if (!slot) {
    return { error: "Jam pelajaran tidak ditemukan." };
  }
  if (slot.type !== "mengajar") {
    return {
      error: `Jam ke-${slot.periodNumber} ${DAY_LABEL[slot.day as Day]} bukan jam mengajar, jadi tidak bisa diisi pelajaran.`,
    };
  }

  const room = rooms.find((r) => r.id === roomId);

  const conflicts = findConflicts(
    {
      timeSlotId,
      teacherId: assignment.teacherId,
      teacherName: assignment.teacherName,
      classId: assignment.classId,
      className: assignment.className,
      roomId,
      roomName: room?.name ?? null,
    },
    entries,
  );

  if (conflicts.length > 0) {
    return { conflicts: conflicts.map((c) => c.message) };
  }

  try {
    await createScheduleEntry(supabase, {
      academicYearId,
      timeSlotId,
      teachingAssignmentId,
      roomId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Unique constraint (time_slot_id, teaching_assignment_id).
    if (message.includes("duplicate") || message.includes("unique")) {
      return {
        error: `${assignment.subjectName} untuk ${assignment.className} sudah ada di jam ini.`,
      };
    }
    return { error: "Gagal menyimpan jadwal. Coba lagi." };
  }

  await recordHistory(supabase, {
    academicYearId,
    entityType: "schedule_entry",
    entityId: null,
    action: "create",
    summary: `${assignment.subjectName} (${assignment.teacherName}) ditempatkan di ${assignment.className} — ${DAY_LABEL[slot.day as Day]} jam ke-${slot.periodNumber}`,
  });

  revalidatePath("/jadwal");
  return {
    success: `${assignment.subjectName} masuk ke ${DAY_LABEL[slot.day as Day]} jam ke-${slot.periodNumber}.`,
  };
}

/** Menghapus satu penempatan. Beban Mengajar-nya tidak ikut terhapus. */
export async function removeScheduleEntryAction(formData: FormData) {
  const id = String(formData.get("entryId") ?? "");
  const academicYearId = String(formData.get("academicYearId") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const entries = await listScheduleEntriesForYear(supabase, academicYearId);
  const entry = entries.find((e) => e.id === id);

  await deleteScheduleEntry(supabase, id);

  if (entry) {
    await recordHistory(supabase, {
      academicYearId,
      entityType: "schedule_entry",
      entityId: id,
      action: "delete",
      summary: `${entry.subjectName} (${entry.teacherName}) dikeluarkan dari ${entry.className} — ${DAY_LABEL[entry.day as Day]} jam ke-${entry.periodNumber}`,
    });
  }

  revalidatePath("/jadwal");
}

/**
 * Memindahkan penempatan ke jam lain — jawaban untuk "edit jam ke berapa".
 * Divalidasi dengan aturan bentrok yang sama, dengan entri itu sendiri
 * dikecualikan supaya tidak dianggap bentrok dengan dirinya.
 */
export async function moveScheduleEntryAction(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const id = String(formData.get("entryId") ?? "");
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const targetSlotId = String(formData.get("targetSlotId") ?? "");

  if (!id || !targetSlotId) {
    return { error: "Pilih jam tujuan dulu." };
  }

  const supabase = await createClient();
  const [entries, slots] = await Promise.all([
    listScheduleEntriesForYear(supabase, academicYearId),
    listTimeStructureForYear(supabase, academicYearId),
  ]);

  const entry = entries.find((e) => e.id === id);
  if (!entry) return { error: "Jadwal tidak ditemukan." };

  const slot = slots.find((s) => s.id === targetSlotId);
  if (!slot) return { error: "Jam tujuan tidak ditemukan." };
  if (slot.type !== "mengajar") {
    return {
      error: `Jam ke-${slot.periodNumber} ${DAY_LABEL[slot.day as Day]} bukan jam mengajar.`,
    };
  }

  const conflicts = findConflicts(
    {
      timeSlotId: targetSlotId,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      classId: entry.classId,
      className: entry.className,
      roomId: entry.roomId,
      roomName: entry.roomName,
      ignoreEntryId: entry.id,
    },
    entries,
  );

  if (conflicts.length > 0) {
    return { conflicts: conflicts.map((c) => c.message) };
  }

  await moveScheduleEntry(supabase, id, targetSlotId);

  await recordHistory(supabase, {
    academicYearId,
    entityType: "schedule_entry",
    entityId: id,
    action: "update",
    summary: `${entry.subjectName} (${entry.className}) dipindah dari ${DAY_LABEL[entry.day as Day]} jam ke-${entry.periodNumber} ke ${DAY_LABEL[slot.day as Day]} jam ke-${slot.periodNumber}`,
  });

  revalidatePath("/jadwal");
  return {
    success: `Dipindah ke ${DAY_LABEL[slot.day as Day]} jam ke-${slot.periodNumber}.`,
  };
}
