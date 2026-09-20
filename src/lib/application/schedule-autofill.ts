import { findConflicts } from "@/lib/application/schedule-conflict";
import type { ScheduleEntry } from "@/lib/domain/schedule";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { TimeSlot, Day } from "@/lib/domain/time-structure";
import { DAYS } from "@/lib/domain/time-structure";

/**
 * JADWAL OTOMATIS — mesin isi-otomatis deterministik, BUKAN AI.
 *
 * Prinsip non-negotiable (sama seperti penempatan manual, Bagian
 * schedule-conflict.ts): tiap penempatan divalidasi lewat findConflicts()
 * YANG SAMA PERSIS dipakai penempatan manual — tidak ada jalur validasi
 * kedua yang bisa memberi hasil berbeda. Kalau slot kandidat bentrok atau
 * melanggar batas JP berturut-turut, kandidat itu dilewati, bukan
 * dipaksakan.
 *
 * Cakupan (Bagian "Jadwal Otomatis" dari pemilik produk):
 *  a. "Lengkapi slot kosong" — hanya mengisi slot yang BENAR-BENAR kosong,
 *     tidak pernah menyentuh yang sudah terisi.
 *  b. "Set 1 minggu penuh" — pemanggil bertanggung jawab menghapus entri
 *     lama SEBELUM memanggil fungsi ini (lihat schedule.actions.ts);
 *     fungsi ini sendiri tetap sama, cuma existingEntries yang dikirim
 *     sudah kosong untuk kelas itu.
 *
 * TIDAK termasuk: continuity rule istirahat (masih ditelaah, sama seperti
 * yang tercatat di halaman Aturan), dan tidak pernah memilih ruang
 * (auto-fill sengaja tidak menetapkan ruang — operator yang menentukan
 * kalau memang perlu).
 */

export interface AutoFillPlacement {
  teachingAssignmentId: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  subjectColorKey: string | null;
  classId: string;
  className: string;
  day: Day;
  periodNumber: number;
}

export interface AutoFillShortfall {
  teachingAssignmentId: string;
  teacherName: string;
  subjectName: string;
  className: string;
  targetJp: number;
  filledJp: number;
  remainingJp: number;
  /** Alasan tidak semua JP bisa ditempatkan — bahasa operator. */
  reason: string;
}

export interface AutoFillResult {
  placements: AutoFillPlacement[];
  shortfalls: AutoFillShortfall[];
}

export function autoFillClassSchedule(input: {
  classId: string;
  assignments: TeachingAssignment[];
  timeSlots: TimeSlot[];
  existingEntries: ScheduleEntry[];
  maxConsecutiveJp: number | null;
}): AutoFillResult {
  const { classId, timeSlots, maxConsecutiveJp } = input;

  const classAssignments = input.assignments.filter(
    (a) => a.classId === classId && a.status === "active",
  );

  const teachingSlots = timeSlots
    .filter((s) => s.status === "active" && s.type === "mengajar")
    .sort(
      (a, b) =>
        DAYS.indexOf(a.day as Day) - DAYS.indexOf(b.day as Day) ||
        a.periodNumber - b.periodNumber,
    );

  // Slot kelas ini yang sudah terisi — tidak pernah disentuh (aturan "a").
  const occupiedByThisClass = new Set(
    input.existingEntries
      .filter((e) => e.classId === classId)
      .map((e) => `${e.day}__${e.periodNumber}`),
  );

  // Salinan kerja entries — bertambah tiap kali kita "menempatkan" kandidat,
  // supaya findConflicts() berikutnya melihat penempatan yang baru saja
  // dibuat di iterasi ini juga (tidak boleh menempatkan guru yang sama dua
  // kali di jam yang sama HANYA karena keduanya belum tersimpan ke DB).
  const workingEntries: ScheduleEntry[] = [...input.existingEntries];

  const placements: AutoFillPlacement[] = [];
  const shortfalls: AutoFillShortfall[] = [];

  // Assignment dengan sisa JP terbanyak diproses lebih dulu — mengurangi
  // fragmentasi (assignment besar tidak kehabisan slot gara-gara slot
  // sisa sudah habis dipakai assignment kecil yang diproses lebih dulu).
  const sorted = [...classAssignments].sort((a, b) => b.targetJp - a.targetJp);

  for (const assignment of sorted) {
    const alreadyScheduled = input.existingEntries.filter(
      (e) => e.teachingAssignmentId === assignment.id,
    ).length;
    let remaining = assignment.targetJp - alreadyScheduled;
    let filledThisRun = 0;

    if (remaining <= 0) continue;

    for (const slot of teachingSlots) {
      if (remaining <= 0) break;

      const slotKey = `${slot.day}__${slot.periodNumber}`;
      if (occupiedByThisClass.has(slotKey)) continue; // aturan "a"

      const conflicts = findConflicts(
        {
          day: slot.day,
          periodNumber: slot.periodNumber,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          classId: assignment.classId,
          className: assignment.className,
          roomId: null,
          roomName: null,
        },
        workingEntries,
        maxConsecutiveJp,
      );
      if (conflicts.length > 0) continue; // aturan "c" & "d"

      const placement: AutoFillPlacement = {
        teachingAssignmentId: assignment.id,
        teacherId: assignment.teacherId,
        teacherName: assignment.teacherName,
        subjectId: assignment.subjectId,
        subjectName: assignment.subjectName,
        subjectColorKey: assignment.subjectColorKey,
        classId: assignment.classId,
        className: assignment.className,
        day: slot.day,
        periodNumber: slot.periodNumber,
      };
      placements.push(placement);

      // Kandidat ini langsung "aktif" untuk pengecekan berikutnya.
      occupiedByThisClass.add(slotKey);
      workingEntries.push({
        id: `pending-${placements.length}`,
        academicYearId: assignment.academicYearId,
        teachingAssignmentId: assignment.id,
        roomId: null,
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        classId: assignment.classId,
        day: slot.day,
        periodNumber: slot.periodNumber,
        source: "auto",
        locked: false,
        teacherName: assignment.teacherName,
        subjectName: assignment.subjectName,
        subjectColorKey: assignment.subjectColorKey,
        className: assignment.className,
        roomName: null,
      });

      remaining -= 1;
      filledThisRun += 1;
    }

    if (remaining > 0) {
      shortfalls.push({
        teachingAssignmentId: assignment.id,
        teacherName: assignment.teacherName,
        subjectName: assignment.subjectName,
        className: assignment.className,
        targetJp: assignment.targetJp,
        filledJp: alreadyScheduled + filledThisRun,
        remainingJp: remaining,
        reason:
          teachingSlots.length === 0
            ? "Belum ada slot mengajar di struktur waktu."
            : `Tidak ada slot kosong tersisa yang tidak bentrok untuk ${assignment.teacherName} — kemungkinan jadwal ${assignment.className} sudah padat, atau ${assignment.teacherName} sudah mengajar di sebagian besar jam yang tersedia.`,
      });
    }
  }

  return { placements, shortfalls };
}
