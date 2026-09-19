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
import { getAcademicYearById } from "@/lib/data-access/academic-year";
import { findConflicts } from "@/lib/application/schedule-conflict";
import { DAY_LABEL, type Day } from "@/lib/domain/time-structure";

export interface ScheduleActionState {
  error?: string;
  /** Daftar bentrok dalam bahasa operator — ditampilkan apa adanya. */
  conflicts?: string[];
  success?: string;
}

const CLASH_MESSAGE: Record<"teacher" | "class" | "duplicate", string> = {
  teacher: "Guru ini sudah mengajar di jam yang sama (baru saja ditempatkan dari perangkat lain).",
  class: "Kelas ini sudah menerima pelajaran lain di jam yang sama (baru saja ditempatkan dari perangkat lain).",
  duplicate: "Data ini sudah ada di jam tersebut.",
};

/**
 * Menempatkan satu Beban Mengajar ke satu hari + jam ke-.
 *
 * Urutan sengaja: validasi DULU, simpan KEMUDIAN. Bentrok harus diketahui
 * sebelum commit, bukan setelah — ini aturan non-negotiable yang lahir dari
 * insiden nyata di V2. Constraint database (no_teacher_clash/no_class_clash)
 * tetap jadi jaring pengaman kedua untuk kasus dua operator menyimpan
 * bersamaan.
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
  const requestedJp = Number(formData.get("jpCount") ?? 1);

  if (!academicYearId || !timeSlotId || !teachingAssignmentId) {
    return { error: "Data belum lengkap — pilih mata pelajaran dulu." };
  }

  if (!Number.isInteger(requestedJp) || requestedJp < 1 || requestedJp > 3) {
    return { error: "Jumlah JP harus 1, 2, atau 3." };
  }

  const supabase = await createClient();

  const [assignments, entries, rooms, slots, academicYear] = await Promise.all([
    listTeachingAssignmentsForYear(supabase, academicYearId),
    listScheduleEntriesForYear(supabase, academicYearId),
    listRooms(supabase),
    listTimeStructureForYear(supabase, academicYearId),
    getAcademicYearById(supabase, academicYearId),
  ]);

  const assignment = assignments.find((a) => a.id === teachingAssignmentId);
  if (!assignment) {
    return { error: "Beban mengajar tidak ditemukan." };
  }

  const scheduledJp = entries.filter(
    (entry) => entry.teachingAssignmentId === teachingAssignmentId,
  ).length;
  const remainingJp = assignment.targetJp - scheduledJp;

  if (remainingJp <= 0) {
    return { error: "Target JP untuk beban mengajar ini sudah terpenuhi." };
  }

  if (requestedJp > remainingJp) {
    return {
      error: "Sisa JP " + remainingJp + ". Jumlah JP yang ditambahkan tidak boleh melebihi sisa JP.",
    };
  }

  const startSlot = slots.find((s) => s.id === timeSlotId);
  if (!startSlot) {
    return { error: "Jam pelajaran tidak ditemukan." };
  }
  if (startSlot.type !== "mengajar") {
    return {
      error:
        "Jam ke-" +
        startSlot.periodNumber +
        " " +
        DAY_LABEL[startSlot.day as Day] +
        " bukan jam mengajar, jadi tidak bisa diisi pelajaran.",
    };
  }

  const targetSlots = Array.from({ length: requestedJp }, (_, index) =>
    slots.find(
      (s) =>
        s.day === startSlot.day &&
        s.periodNumber === startSlot.periodNumber + index,
    ),
  );

  if (targetSlots.some((slot) => !slot)) {
    return {
      error:
        "Tidak ada " +
        requestedJp +
        " jam mengajar berurutan mulai jam ke-" +
        startSlot.periodNumber +
        " " +
        DAY_LABEL[startSlot.day as Day] +
        ".",
    };
  }

  const consecutiveSlots =
    targetSlots as NonNullable<(typeof targetSlots)[number]>[];
  const invalidSlot = consecutiveSlots.find((slot) => slot.type !== "mengajar");
  if (invalidSlot) {
    return {
      error:
        "Jam ke-" +
        invalidSlot.periodNumber +
        " " +
        DAY_LABEL[invalidSlot.day as Day] +
        " bukan jam mengajar, jadi " +
        requestedJp +
        " JP berurutan tidak bisa ditempatkan di sini.",
    };
  }

  const room = rooms.find((r) => r.id === roomId);
  const maxConsecutiveJp = academicYear?.maxConsecutiveJp ?? null;

  const allConflicts = consecutiveSlots.flatMap((slot) =>
    findConflicts(
      {
        day: slot.day,
        periodNumber: slot.periodNumber,
        teacherId: assignment.teacherId,
        teacherName: assignment.teacherName,
        classId: assignment.classId,
        className: assignment.className,
        roomId,
        roomName: room?.name ?? null,
      },
      entries,
      maxConsecutiveJp,
    ).map(
      (conflict) =>
        "Jam ke-" + slot.periodNumber + ": " + conflict.message,
    ),
  );

  if (allConflicts.length > 0) {
    return { conflicts: allConflicts };
  }

  const result = await createScheduleEntries(
    supabase,
    consecutiveSlots.map((slot) => ({
      academicYearId,
      teachingAssignmentId,
      teacherId: assignment.teacherId,
      subjectId: assignment.subjectId,
      classId: assignment.classId,
      day: slot.day,
      periodNumber: slot.periodNumber,
      roomId,
    })),
  );

  if (!result.ok) {
    return {
      conflicts: [
        CLASH_MESSAGE[result.clash === "unknown" ? "duplicate" : result.clash],
      ],
    };
  }

  await recordHistory(supabase, {
    academicYearId,
    entityType: "schedule_entry",
    entityId: null,
    action: "create",
    summary:
      assignment.subjectName +
      " (" +
      assignment.teacherName +
      ") ditempatkan di " +
      assignment.className +
      " — " +
      DAY_LABEL[startSlot.day as Day] +
      " jam ke-" +
      startSlot.periodNumber +
      " s.d. " +
      (startSlot.periodNumber + requestedJp - 1) +
      " (" +
      requestedJp +
      " JP)",
  });

  revalidatePath("/jadwal");
  return {
    success:
      assignment.subjectName +
      " masuk ke " +
      DAY_LABEL[startSlot.day as Day] +
      " jam ke-" +
      startSlot.periodNumber +
      " s.d. " +
      (startSlot.periodNumber + requestedJp - 1) +
      " (" +
      requestedJp +
      " JP).",
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
  const [entries, slots, academicYear] = await Promise.all([
    listScheduleEntriesForYear(supabase, academicYearId),
    listTimeStructureForYear(supabase, academicYearId),
    getAcademicYearById(supabase, academicYearId),
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
      day: slot.day,
      periodNumber: slot.periodNumber,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      classId: entry.classId,
      className: entry.className,
      roomId: entry.roomId,
      roomName: entry.roomName,
      ignoreEntryId: entry.id,
    },
    entries,
    academicYear?.maxConsecutiveJp ?? null,
  );

  if (conflicts.length > 0) {
    return { conflicts: conflicts.map((c) => c.message) };
  }

  const result = await moveScheduleEntry(supabase, id, {
    day: slot.day,
    periodNumber: slot.periodNumber,
  });

  if (!result.ok) {
    return { conflicts: [CLASH_MESSAGE[result.clash === "unknown" ? "duplicate" : result.clash]] };
  }

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
