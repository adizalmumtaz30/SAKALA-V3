import { findConflicts } from "@/lib/application/schedule-conflict";
import type { ScheduleEntry } from "@/lib/domain/schedule";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { TimeSlot, Day } from "@/lib/domain/time-structure";
import { DAYS } from "@/lib/domain/time-structure";
import { optimizeSchedule } from "@/lib/application/schedule-optimizer";

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
 * KERAPIHAN — GAP AVOIDANCE & BEBAN HARIAN (LEVEL 2 QUALITY, master spec
 * C.2: "distribusi, gap, beban, konsistensi" — secara eksplisit LEBIH
 * TINGGI prioritasnya daripada slider Pemetaan/Persebaran di bawah, yang
 * cuma LEVEL 3 PREFERENCE). Ditambahkan setelah operator melaporkan
 * "lompat jam" nyata, lalu DISEMPURNAKAN lagi setelah dilaporkan lubang
 * masih muncul di data sungguhan: simulasi awal cuma pakai 1 kelas kosong
 * tanpa guru yang sudah sibuk di kelas lain — di dunia nyata guru
 * mengajar BANYAK kelas, jadi slot "ideal" sering kebentur jadwal guru
 * itu di kelas lain.
 *
 * RUMUS SKALA PRIORITAS JP HARIAN (target eksplisit, bukan cuma
 * "hari paling kosong menang"):
 *   idealPerHari = totalJpMingguan / jumlahHariMengajarAktif
 * Tiap hari diklasifikasi relatif ke idealPerHari itu:
 *   CUKUP  (band 0) — terisi < idealPerHari (dibulatkan bawah)
 *   SEDANG (band 1) — terisi di sekitar idealPerHari
 *   PENUH  (band 2) — terisi > idealPerHari (dibulatkan atas)
 * Dihitung DUA KALI dengan basis beda, digabung (dijumlah):
 *   1. Basis KELAS — totalJp = jumlah targetJp semua Beban Mengajar
 *      kelas yang sedang diisi.
 *   2. Basis GURU — totalJp = jumlah targetJp SEMUA Beban Mengajar guru
 *      itu DI SELURUH SEKOLAH (lintas kelas lain, bukan cuma kelas yang
 *      sedang diisi), dan terisi-nya dibaca dari existingEntries yang
 *      juga lintas kelas (data terkini, bukan snapshot lama) — supaya
 *      "Guru A 12 JP/minggu" tidak berakhir 6+6 di 2 hari cuma karena
 *      kelas ini kebetulan cocok di situ, walau di kelas lain guru itu
 *      sebenarnya sudah punya jam di hari-hari lain juga.
 *
 * Dua sinyal LAMA dari FRONTIER & beban-per-kelas-mentah digabung/
 * digantikan rumus band di atas; frontier (larangan lompat dalam satu
 * hari) TETAP tier tertinggi karena itu keluhan paling kentara ("bolong"
 * di tengah hari) — band dipakai untuk memilih HARI mana yang
 * diprioritaskan di antara pilihan yang sama-sama frontier.
 *
 * BATASAN JUJUR: ini tetap preferensi urutan (greedy per-assignment),
 * bukan solver yang menjamin nol lubang mutlak. Kalau satu-satunya slot
 * yang lolos findConflicts() untuk assignment tertentu kebetulan bukan
 * frontier (mis. gurunya cuma longgar di jam itu di seluruh minggu),
 * lubang kecil masih mungkin muncul — VALIDITY tetap di atas segalanya,
 * auto-fill tidak boleh gagal total cuma demi kerapihan sempurna.
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
 * URUTAN PRIORITAS lengkap tiap kandidat slot (tinggi ke rendah):
 *   VALIDITY (findConflicts, tidak bisa dilewati)
 *   > FRONTIER (tidak membuat lubang)
 *   > BAND HARIAN gabungan kelas+guru (rumus idealPerHari di atas)
 *   > continuity/spread assignment ini (slider Pemetaan & Persebaran)
 */

export type SpreadPreference = "concentrated" | "balanced" | "spread";

/**
 * Rumus skala prioritas JP harian — lihat dokumentasi di atas.
 * band 0 = CUKUP (masih longgar), 1 = SEDANG (pas target), 2 = PENUH
 * (sudah lewat target, jangan ditambah lagi kalau ada pilihan lain).
 */
function dayBand(current: number, idealPerDay: number): 0 | 1 | 2 {
  if (idealPerDay <= 0) return current === 0 ? 0 : 2;
  if (current < Math.floor(idealPerDay)) return 0;
  if (current <= Math.ceil(idealPerDay)) return 1;
  return 2;
}

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

  // §Rumus skala prioritas JP harian — jumlah hari mengajar aktif jadi
  // penyebut idealPerHari (lihat dokumentasi di atas).
  const availableDays = new Set(teachingSlots.map((s) => s.day as Day)).size || 1;

  const classIdealPerDay =
    classAssignments.reduce((sum, a) => sum + a.targetJp, 0) / availableDays;

  // Basis GURU dihitung dari input.assignments TANPA filter classId —
  // lintas kelas lain di seluruh sekolah — dan totalnya HANYA dari
  // assignment aktif, konsisten dengan classAssignments di atas.
  const teacherWeeklyTotal = new Map<string, number>();
  for (const a of input.assignments) {
    if (a.status !== "active") continue;
    teacherWeeklyTotal.set(a.teacherId, (teacherWeeklyTotal.get(a.teacherId) ?? 0) + a.targetJp);
  }
  const teacherIdealPerDay = (teacherId: string) =>
    (teacherWeeklyTotal.get(teacherId) ?? 0) / availableDays;

  // teacherDayCount: beban guru per hari SAAT INI, dibaca dari
  // existingEntries TANPA filter classId — data live lintas kelas, bukan
  // snapshot kelas yang sedang diisi saja ("integrasikan data dengan
  // jadwal yang sudah ada", sesuai permintaan eksplisit).
  const teacherDayCount = new Map<string, Map<Day, number>>();
  for (const e of input.existingEntries) {
    const perDay = teacherDayCount.get(e.teacherId) ?? new Map<Day, number>();
    perDay.set(e.day as Day, (perDay.get(e.day as Day) ?? 0) + 1);
    teacherDayCount.set(e.teacherId, perDay);
  }

  // Slot kelas ini yang sudah terisi — tidak pernah disentuh (aturan "a").
  const occupiedByThisClass = new Set(
    input.existingEntries
      .filter((e) => e.classId === classId)
      .map((e) => `${e.day}__${e.periodNumber}`),
  );

  // §Kerapihan — dihitung di tingkat KELAS, lintas semua assignment
  // (bukan per-assignment seperti placedPeriodsByDay di bawah nanti).
  // classDayMax: jam terakhir yang sudah terisi kelas ini per hari (0 =
  // hari itu masih kosong). classDayCount: total JP terisi per hari,
  // dipakai untuk menyeimbangkan beban antar hari.
  const classDayMax = new Map<Day, number>();
  const classDayCount = new Map<Day, number>();
  for (const e of input.existingEntries) {
    if (e.classId !== classId) continue;
    const day = e.day as Day;
    classDayMax.set(day, Math.max(classDayMax.get(day) ?? 0, e.periodNumber));
    classDayCount.set(day, (classDayCount.get(day) ?? 0) + 1);
  }

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
        // TIER 0 — frontier: lanjutkan dari jam terakhir yang sudah
        // terisi hari itu, jangan lompat dan tinggalkan lubang.
        const frontierA = a.periodNumber === (classDayMax.get(a.day as Day) ?? 0) + 1 ? 0 : 1;
        const frontierB = b.periodNumber === (classDayMax.get(b.day as Day) ?? 0) + 1 ? 0 : 1;
        if (frontierA !== frontierB) return frontierA - frontierB;

        // TIER 1 — band harian gabungan (rumus idealPerHari): di antara
        // slot yang sama-sama frontier, hari yang bandnya lebih rendah
        // (lebih longgar) didahulukan — dihitung dari basis KELAS *dan*
        // basis GURU (lintas kelas lain), dijumlah supaya keduanya
        // dipertimbangkan bersama.
        const classBandA = dayBand(classDayCount.get(a.day as Day) ?? 0, classIdealPerDay);
        const classBandB = dayBand(classDayCount.get(b.day as Day) ?? 0, classIdealPerDay);
        const teacherDayA = teacherDayCount.get(assignment.teacherId)?.get(a.day as Day) ?? 0;
        const teacherDayB = teacherDayCount.get(assignment.teacherId)?.get(b.day as Day) ?? 0;
        const teacherBandA = dayBand(teacherDayA, teacherIdealPerDay(assignment.teacherId));
        const teacherBandB = dayBand(teacherDayB, teacherIdealPerDay(assignment.teacherId));
        const bandA = classBandA + teacherBandA;
        const bandB = classBandB + teacherBandB;
        if (bandA !== bandB) return bandA - bandB;

        // TIER 2/3 — Pemetaan & Persebaran (slider), khusus assignment ini.
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

        classDayMax.set(
          slot.day as Day,
          Math.max(classDayMax.get(slot.day as Day) ?? 0, slot.periodNumber),
        );
        classDayCount.set(slot.day as Day, (classDayCount.get(slot.day as Day) ?? 0) + 1);

        const teacherPerDay = teacherDayCount.get(assignment.teacherId) ?? new Map<Day, number>();
        teacherPerDay.set(slot.day as Day, (teacherPerDay.get(slot.day as Day) ?? 0) + 1);
        teacherDayCount.set(assignment.teacherId, teacherPerDay);

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

  // OPTIMIZER — setelah greedy menghasilkan solusi feasible, lakukan
  // perbaikan berbasis objective secara deterministik. Optimizer tidak
  // mengubah manual/locked/existing entries; hanya placement AUTO dari run
  // ini yang menjadi movable. Move + swap dievaluasi terhadap state yang
  // sama dan tetap melewati findConflicts() sebagai hard constraint.
  const movableEntryIds = new Set(
    placements.map((_, index) => `pending-${index + 1}`),
  );

  const optimization = optimizeSchedule({
    state: {
      entries: workingEntries,
      assignments: input.assignments,
      timeSlots,
      classId,
      maxConsecutiveJp,
    },
    movableEntryIds,
    placements,
    maxIterations: Math.max(200, placements.length * 12),
  });

  return {
    placements: optimization.placements,
    shortfalls,
    optimization,
  };
}
