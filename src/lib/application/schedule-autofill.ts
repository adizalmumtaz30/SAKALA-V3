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
 * TIDAK termasuk: pemilihan ruang (auto-fill sengaja tidak menetapkan
 * ruang — operator yang menentukan kalau memang perlu).
 *
 * CONTINUITY RULE (istirahat tidak boleh memutus rangkaian mapel yang
 * sama) — diterapkan sebagai PREFERENSI URUTAN internal, bukan aturan
 * blocking dan bukan pengaturan yang tampil ke operator (sesuai arahan:
 * "berada dibelakang tidak perlu tampil"). Untuk assignment yang masih
 * butuh >1 JP, kandidat slot yang BERSAMBUNG LANGSUNG (period_number
 * selisih 1, hari sama) dengan JP assignment itu yang sudah ditempatkan
 * SELALU dicoba lebih dulu daripada slot lain — dan karena teachingSlots
 * di sini sudah difilter hanya type "mengajar", dua slot mengajar dengan
 * period_number TIDAK bersebelahan pasti dipisahkan istirahat/kegiatan di
 * antaranya. Jadi "selisih 1" secara struktural berarti "tidak dipisah
 * istirahat". Ini preferensi, bukan blok keras — kalau tidak ada slot
 * bersambung yang lolos findConflicts(), tetap boleh menempatkan JP di
 * hari/jam lain daripada gagal total.
 *
 * PEMETAAN & PERSEBARAN (LOCK 10, master spec — "Generator operator-facing
 * pakai Pemetaan + Persebaran") — satu slider 3-posisi yang operator lihat
 * di panel Jadwal Otomatis:
 *  - "concentrated" (Terkonsentrasi): condongkan ke continuity — JP yang
 *    sama disambung dulu sebelum melebar ke hari baru.
 *  - "spread" (Merata): condongkan ke hari baru — sebuah assignment
 *    diusahakan hadir di sebanyak mungkin hari berbeda dulu, continuity
 *    cuma jadi penentu kalau semua hari sudah kepakai.
 *  - "balanced" (Seimbang, default): dua pertimbangan itu ditimbang setara.
 *
 * Ini LEVEL 3 (PREFERENCE) di hierarki C.2 master spec — selalu di bawah
 * VALIDITY (findConflicts) dan tidak pernah membuat kandidat yang sudah
 * lolos findConflicts() jadi ditolak; cuma menentukan URUTAN mana yang
 * dicoba lebih dulu.
 */

export type SpreadPreference = "concentrated" | "balanced" | "spread";

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
  spreadPreference?: SpreadPreference;
}): AutoFillResult {
  const { classId, timeSlots, maxConsecutiveJp } = input;
  const spreadPreference = input.spreadPreference ?? "balanced";

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

    // Period yang sudah ditempati assignment ini, per hari — dipakai untuk
    // preferensi continuity. Termasuk yang sudah ada di DB sebelumnya
    // (mode "lengkapi slot kosong" bisa menyambung ke JP yang sudah
    // ditempatkan manual sebelumnya).
    const placedPeriodsByDay = new Map<Day, Set<number>>();
    for (const e of workingEntries) {
      if (e.teachingAssignmentId !== assignment.id) continue;
      const set = placedPeriodsByDay.get(e.day as Day) ?? new Set<number>();
      set.add(e.periodNumber);
      placedPeriodsByDay.set(e.day as Day, set);
    }

    const isContinuity = (slot: TimeSlot) => {
      const placed = placedPeriodsByDay.get(slot.day as Day);
      if (!placed) return false;
      return placed.has(slot.periodNumber - 1) || placed.has(slot.periodNumber + 1);
    };
    const dayUsage = (day: Day) => placedPeriodsByDay.get(day)?.size ?? 0;

    while (remaining > 0) {
      // Pemetaan & Persebaran — urutan kandidat menyesuaikan slider yang
      // operator pilih (lihat dokumentasi SpreadPreference di atas).
      // Urutan hari/jam alami tetap dipertahankan di dalam masing-masing
      // kelompok prioritas supaya hasilnya deterministik (bukan acak).
      const candidates = [...teachingSlots].sort((a, b) => {
        const contA = isContinuity(a) ? 0 : 1;
        const contB = isContinuity(b) ? 0 : 1;
        const newDayA = dayUsage(a.day as Day) === 0 ? 0 : 1;
        const newDayB = dayUsage(b.day as Day) === 0 ? 0 : 1;

        if (spreadPreference === "concentrated") {
          return contA !== contB ? contA - contB : newDayA - newDayB;
        }
        if (spreadPreference === "spread") {
          return newDayA !== newDayB ? newDayA - newDayB : contA - contB;
        }
        return contA + newDayA - (contB + newDayB); // balanced
      });

      let placedOne = false;

      for (const slot of candidates) {
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
        const daySet = placedPeriodsByDay.get(slot.day as Day) ?? new Set<number>();
        daySet.add(slot.periodNumber);
        placedPeriodsByDay.set(slot.day as Day, daySet);

        remaining -= 1;
        filledThisRun += 1;
        placedOne = true;
        break;
      }

      if (!placedOne) break; // tidak ada slot tersisa yang lolos sama sekali
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
