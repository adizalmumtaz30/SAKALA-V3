"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  listScheduleEntriesForYear,
  createScheduleEntries,
  deleteScheduleEntry,
  deleteScheduleEntriesForClass,
  moveScheduleEntry,
  applySchedulePositionUpdates,
} from "@/lib/data-access/schedule";
import { autoFillClassSchedule, type SpreadPreference } from "@/lib/application/schedule-autofill";
import { computeDiagnosticIssues } from "@/lib/application/diagnostics";
import { listTeachers } from "@/lib/data-access/teacher";
import { listSubjects } from "@/lib/data-access/subject";
import { listClassesForYear } from "@/lib/data-access/class";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listRooms } from "@/lib/data-access/room";
import { listTimeStructureForYear } from "@/lib/data-access/time-structure";
import { recordHistory } from "@/lib/data-access/history";
import { getAcademicYearById } from "@/lib/data-access/academic-year";
import { findConflicts } from "@/lib/application/schedule-conflict";
import { DAY_LABEL, DAYS, type Day } from "@/lib/domain/time-structure";
import { optimizeSchedule } from "@/lib/scheduling/optimizer";
import { scoreSchedule } from "@/lib/scheduling/optimizer/score-schedule";
import type { ScheduleState } from "@/lib/scheduling/types/schedule-state";

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

  // Sertakan slot yang sedang akan ditambahkan saat mengecek batas JP
  // berturut-turut, supaya 1+3 JP tidak lolos ketika batasnya 3.
  const pendingEntries = consecutiveSlots.map((slot) => ({
    id: "pending-" + slot.id,
    academicYearId,
    teachingAssignmentId,
    roomId,
    teacherId: assignment.teacherId,
    subjectId: assignment.subjectId,
    classId: assignment.classId,
    day: slot.day,
    periodNumber: slot.periodNumber,
    source: "manual" as const,
    locked: true,
    teacherName: assignment.teacherName,
    subjectName: assignment.subjectName,
    subjectColorKey: assignment.subjectColorKey,
    className: assignment.className,
    roomName: room?.name ?? null,
  }));

  const validationEntries = entries.concat(pendingEntries);

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
      validationEntries.filter((entry) => entry.id !== "pending-" + slot.id),
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

// ---------------------------------------------------------------------------
// JADWAL OTOMATIS — mesin isi-otomatis deterministik (bukan AI).
// Segmented per kelas yang sedang dipilih, sesuai permintaan pemilik produk.
// ---------------------------------------------------------------------------

export interface AutoFillActionState {
  error?: string;
  result?: {
    classId: string;
    className: string;
    mode: "fill-empty" | "full-week";
    spreadPreference: SpreadPreference;
    placedCount: number;
    deletedCount: number;
    shortfalls: {
      subjectName: string;
      teacherName: string;
      targetJp: number;
      filledJp: number;
      remainingJp: number;
      reason: string;
    }[];
    /** Masalah relasional (mis. mapel nonaktif tapi masih dipakai) yang
     *  relevan untuk kelas ini — dibaca dari diagnostics yang SAMA dengan
     *  panel "Perlu Dicek" di Beranda, bukan pengecekan kedua yang
     *  terpisah dan bisa beda hasil. */
    relatedIssues: { message: string; href: string; actionLabel: string }[];
  };
}

/**
 * Repair global untuk internal gap pada jadwal yang sudah tersimpan.
 *
 * Berbeda dari auto-fill kelas: aksi ini tidak menghapus jadwal dan tidak
 * membuat placement baru. Ia membaca jadwal aktif, menemukan kelas yang
 * memiliki gap internal, menjalankan optimizer per kelas dengan entri auto
 * unlocked sebagai satu-satunya entri yang boleh dipindah, lalu menyimpan
 * perubahan posisi existing secara atomik. Hasil selalu diverifikasi ulang
 * dari database sebelum dikembalikan ke UI.
 */
export interface ScheduleGapRepairState {
  error?: string;
  result?: {
    academicYearLabel: string;
    classesChecked: number;
    classesChanged: number;
    initialInternalGaps: number;
    finalInternalGaps: number;
    movesAccepted: number;
    swapsAccepted: number;
    iterations: number;
    stoppedReasons: string[];
    persistedEntries: number;
    verified: boolean;
  };
}

function internalGapCountForClass(
  entries: ScheduleState["entries"],
  timeSlots: ScheduleState["timeSlots"],
  classId: string,
) {
  let total = 0;
  for (const day of DAYS) {
    const periods = entries
      .filter((entry) => entry.classId === classId && entry.day === day)
      .map((entry) => entry.periodNumber);
    if (periods.length < 2) continue;
    const first = Math.min(...periods);
    const last = Math.max(...periods);
    for (const slot of timeSlots) {
      if (
        slot.day === day &&
        slot.status === "active" &&
        slot.type === "mengajar" &&
        slot.periodNumber > first &&
        slot.periodNumber < last &&
        !entries.some(
          (entry) =>
            entry.classId === classId &&
            entry.day === day &&
            entry.periodNumber === slot.periodNumber,
        )
      ) {
        total += 1;
      }
    }
  }
  return total;
}

export async function repairScheduleGapsAction(
  _prev: ScheduleGapRepairState,
  formData: FormData,
): Promise<ScheduleGapRepairState> {
  const academicYearId = String(formData.get("academicYearId") ?? "");
  if (!academicYearId) return { error: "Tahun ajaran belum dipilih." };

  const supabase = await createClient();
  const [academicYear, classes, assignments, timeSlots, originalEntries] =
    await Promise.all([
      getAcademicYearById(supabase, academicYearId),
      listClassesForYear(supabase, academicYearId),
      listTeachingAssignmentsForYear(supabase, academicYearId),
      listTimeStructureForYear(supabase, academicYearId),
      listScheduleEntriesForYear(supabase, academicYearId),
    ]);

  if (!academicYear) return { error: "Tahun ajaran tidak ditemukan." };

  const baseState = {
    entries: originalEntries,
    assignments,
    timeSlots,
    maxConsecutiveJp: academicYear.maxConsecutiveJp ?? null,
    spreadPreference: "balanced" as const,
  };

  const classesWithGaps = classes.filter(
    (item) => internalGapCountForClass(originalEntries, timeSlots, item.id) > 0,
  );

  let workingEntries = originalEntries;
  let movesAccepted = 0;
  let swapsAccepted = 0;
  let iterations = 0;
  const stoppedReasons: string[] = [];
  let classesChanged = 0;

  for (const targetClass of classesWithGaps) {
    const initialGaps = internalGapCountForClass(
      workingEntries,
      timeSlots,
      targetClass.id,
    );
    if (initialGaps === 0) continue;

    const mutableEntryIds = new Set(
      workingEntries
        .filter(
          (entry) =>
            entry.source === "auto" &&
            !entry.locked,
        )
        .map((entry) => entry.id),
    );

    const optimized = optimizeSchedule(
      {
        ...baseState,
        entries: workingEntries,
        scope: { type: "full-week", classId: targetClass.id },
        mutableEntryIds,
      },
      { maxIterations: Math.max(150, workingEntries.length * 6) },
    );

    workingEntries = optimized.state.entries;
    movesAccepted += optimized.movesAccepted;
    swapsAccepted += optimized.swapsAccepted;
    iterations += optimized.iterations;
    stoppedReasons.push(
      targetClass.name + ": " + optimized.stoppedReason,
    );

    const finalGaps = internalGapCountForClass(
      workingEntries,
      timeSlots,
      targetClass.id,
    );
    if (finalGaps < initialGaps) classesChanged += 1;
  }

  const initialInternalGaps = classesWithGaps.reduce(
    (sum, item) =>
      sum + internalGapCountForClass(originalEntries, timeSlots, item.id),
    0,
  );
  const finalInternalGaps = classes.reduce(
    (sum, item) =>
      sum + internalGapCountForClass(workingEntries, timeSlots, item.id),
    0,
  );

  const initialIds = new Map(
    originalEntries.map((entry) => [
      entry.id,
      entry.day + "__" + entry.periodNumber,
    ]),
  );
  const movedExistingEntries = workingEntries.filter((entry) => {
    const originalPosition = initialIds.get(entry.id);
    return (
      originalPosition !== undefined &&
      originalPosition !== entry.day + "__" + entry.periodNumber
    );
  });

  const validationClassId = classesWithGaps[0]?.id ?? classes[0]?.id;
  if (validationClassId) {
    const validationObjective = scoreSchedule({
      ...baseState,
      entries: workingEntries,
      scope: { type: "full-week", classId: validationClassId },
      mutableEntryIds: new Set(),
    });
    if (validationObjective[0] > 0) {
      return {
        error:
          "Repair dibatalkan: optimizer menghasilkan konflik hard constraint.",
      };
    }
  }

  if (movedExistingEntries.length > 0) {
    await applySchedulePositionUpdates(
      supabase,
      movedExistingEntries.map((entry) => ({
        id: entry.id,
        day: entry.day,
        periodNumber: entry.periodNumber,
      })),
      academicYearId,
    );
  }

  const reloadedEntries = await listScheduleEntriesForYear(
    supabase,
    academicYearId,
  );
  const verifiedFinalInternalGaps = classes.reduce(
    (sum, item) =>
      sum + internalGapCountForClass(reloadedEntries, timeSlots, item.id),
    0,
  );
  const verified = verifiedFinalInternalGaps === finalInternalGaps;

  if (!verified) {
    return {
      error:
        "Repair berhenti: posisi database berubah berbeda dari hasil optimizer. Tidak ada klaim sukses yang dikembalikan.",
    };
  }

  await recordHistory(supabase, {
    academicYearId,
    entityType: "schedule_entry",
    entityId: null,
    action: "repair_internal_gaps",
    summary:
      "Repair gap internal: " +
      initialInternalGaps +
      " → " +
      verifiedFinalInternalGaps +
      " gap; " +
      movedExistingEntries.length +
      " entri dipindahkan.",
  });

  revalidatePath("/jadwal");

  return {
    result: {
      academicYearLabel: academicYear.label,
      classesChecked: classesWithGaps.length,
      classesChanged,
      initialInternalGaps,
      finalInternalGaps: verifiedFinalInternalGaps,
      movesAccepted,
      swapsAccepted,
      iterations,
      stoppedReasons,
      persistedEntries: movedExistingEntries.length,
      verified,
    },
  };
}

export async function autoFillScheduleAction(
  _prev: AutoFillActionState,
  formData: FormData,
): Promise<AutoFillActionState> {
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const mode = String(formData.get("mode") ?? "") as "fill-empty" | "full-week";
  const spreadRaw = String(formData.get("spreadPreference") ?? "balanced");
  const spreadPreference: SpreadPreference =
    spreadRaw === "concentrated" || spreadRaw === "spread" ? spreadRaw : "balanced";

  if (!academicYearId || !classId) return { error: "Pilih kelas dulu." };
  if (mode !== "fill-empty" && mode !== "full-week") {
    return { error: "Mode Jadwal Otomatis tidak dikenali." };
  }

  const supabase = await createClient();

  const [assignments, timeSlots, academicYear, teachers, subjects, classes] = await Promise.all([
    listTeachingAssignmentsForYear(supabase, academicYearId),
    listTimeStructureForYear(supabase, academicYearId),
    getAcademicYearById(supabase, academicYearId),
    listTeachers(supabase),
    listSubjects(supabase),
    listClassesForYear(supabase, academicYearId),
  ]);

  const targetClass = classes.find((c) => c.id === classId);
  if (!targetClass) return { error: "Kelas tidak ditemukan." };

  let deletedCount = 0;
  if (mode === "full-week") {
    deletedCount = await deleteScheduleEntriesForClass(supabase, academicYearId, classId);
  }

  // Entri terkini SETELAH penghapusan (kalau mode full-week) — dibaca
  // ulang, bukan dihitung manual dari cache, supaya algoritma auto-fill
  // selalu bekerja dari kenyataan database yang sesungguhnya.
  const currentEntries = await listScheduleEntriesForYear(supabase, academicYearId);

  const { placements, shortfalls, movedExistingEntries } = autoFillClassSchedule({
    classId,
    assignments,
    timeSlots,
    existingEntries: currentEntries,
    maxConsecutiveJp: academicYear?.maxConsecutiveJp ?? null,
    spreadPreference,
  });

  // Persist repositioning produced by the global full-week optimizer first.
  // This is intentionally separate from inserting new placements because the
  // moved rows already exist in the database.
  if (movedExistingEntries.length > 0) {
    await applySchedulePositionUpdates(
      supabase,
      movedExistingEntries.map((entry) => ({
        id: entry.id,
        day: entry.day,
        periodNumber: entry.periodNumber,
      })),
      academicYearId,
    );
  }

  // Insert ATOMIK (satu statement) mengikuti pola createScheduleEntries
  // yang sudah dipakai penempatan manual multi-JP — kalau ada satu baris
  // yang bentrok (race jarang dengan operator lain), SELURUH batch auto-
  // fill ini gagal bersama dan operator diminta klik ulang, bukan diam-
  // diam separuh tersimpan.
  let placedCount = 0;
  if (placements.length > 0) {
    const result = await createScheduleEntries(
      supabase,
      placements.map((p) => ({
        academicYearId,
        teachingAssignmentId: p.teachingAssignmentId,
        teacherId: p.teacherId,
        subjectId: p.subjectId,
        classId: p.classId,
        day: p.day,
        periodNumber: p.periodNumber,
        roomId: null,
        source: "auto",
        locked: false,
      })),
    );
    if (!result.ok) {
      return {
        error:
          "Sebagian jam berubah bersamaan saat Jadwal Otomatis diproses. Coba jalankan lagi.",
      };
    }
    placedCount = placements.length;
  }

  const allIssues = computeDiagnosticIssues({ teachers, subjects, classes, assignments, timeSlots });
  const relatedIssues = allIssues.filter((issue) =>
    issue.message.includes(targetClass.name),
  );

  const SPREAD_LABEL: Record<SpreadPreference, string> = {
    concentrated: "Terkonsentrasi",
    balanced: "Seimbang",
    spread: "Merata",
  };

  await recordHistory(supabase, {
    academicYearId,
    entityType: "schedule_entry",
    entityId: null,
    action: mode === "full-week" ? "auto_fill_full_week" : "auto_fill_empty",
    summary:
      mode === "full-week"
        ? `Jadwal Otomatis (${SPREAD_LABEL[spreadPreference]}) — ${targetClass.name}: ${deletedCount} entri lama dihapus, ${placedCount} pelajaran ditempatkan ulang`
        : `Jadwal Otomatis (${SPREAD_LABEL[spreadPreference]}) — ${targetClass.name}: ${placedCount} slot kosong terisi`,
  });

  revalidatePath("/jadwal");

  return {
    result: {
      classId,
      className: targetClass.name,
      mode,
      spreadPreference,
      placedCount,
      deletedCount,
      shortfalls: shortfalls.map((s) => ({
        subjectName: s.subjectName,
        teacherName: s.teacherName,
        targetJp: s.targetJp,
        filledJp: s.filledJp,
        remainingJp: s.remainingJp,
        reason: s.reason,
      })),
      relatedIssues: relatedIssues.map((i) => ({
        message: i.message,
        href: i.href,
        actionLabel: i.actionLabel,
      })),
    },
  };
}
