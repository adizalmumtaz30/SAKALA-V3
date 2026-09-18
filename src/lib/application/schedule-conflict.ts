import type { ScheduleEntry, JpProgress } from "@/lib/domain/schedule";
import { jpStatus } from "@/lib/domain/schedule";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";

/**
 * DETEKSI BENTROK — deterministik, bukan AI.
 *
 * Tiga aturan fisik yang tidak bisa dilanggar di dunia nyata:
 *  1. Satu guru tidak bisa mengajar di dua tempat pada jam yang sama.
 *  2. Satu kelas tidak bisa menerima dua pelajaran pada jam yang sama.
 *  3. Satu ruang tidak bisa dipakai dua rombongan pada jam yang sama.
 *
 * Aturan 1 & 2 SUDAH ditegakkan database sebagai UNIQUE CONSTRAINT
 * (no_teacher_clash, no_class_clash pada schedule_entry) — pengecekan di
 * sini adalah lapisan PERTAMA yang memberi pesan bahasa operator SEBELUM
 * constraint itu sempat tersentuh, bukan pengganti constraint-nya. Aturan
 * ruang tidak ada padanan constraint-nya (room_id boleh kosong), jadi
 * murni ditegakkan di sini.
 *
 * Prinsip (dari insiden nyata V2): bentrok harus diketahui SEBELUM
 * disimpan, bukan sesudah — dan pesannya menyebut nama asli, bukan kode
 * atau warna saja.
 */
export type ConflictKind = "guru" | "kelas" | "ruang";

export interface Conflict {
  kind: ConflictKind;
  message: string;
}

interface Candidate {
  day: string;
  periodNumber: number;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  roomId: string | null;
  roomName: string | null;
  /** Diisi saat memindahkan entri yang sudah ada, supaya tidak bentrok
   *  dengan dirinya sendiri. */
  ignoreEntryId?: string;
}

export function findConflicts(
  candidate: Candidate,
  existing: ScheduleEntry[],
): Conflict[] {
  const sameSlot = existing.filter(
    (e) =>
      e.day === candidate.day &&
      e.periodNumber === candidate.periodNumber &&
      e.id !== candidate.ignoreEntryId,
  );

  const conflicts: Conflict[] = [];

  const teacherClash = sameSlot.find((e) => e.teacherId === candidate.teacherId);
  if (teacherClash) {
    conflicts.push({
      kind: "guru",
      message: `${candidate.teacherName} sudah mengajar ${teacherClash.subjectName} di ${teacherClash.className} pada jam ini.`,
    });
  }

  const classClash = sameSlot.find((e) => e.classId === candidate.classId);
  if (classClash) {
    conflicts.push({
      kind: "kelas",
      message: `${candidate.className} sudah menerima ${classClash.subjectName} (${classClash.teacherName}) pada jam ini.`,
    });
  }

  if (candidate.roomId) {
    const roomClash = sameSlot.find((e) => e.roomId === candidate.roomId);
    if (roomClash) {
      conflicts.push({
        kind: "ruang",
        message: `Ruang ${candidate.roomName ?? ""} sedang dipakai ${roomClash.className} (${roomClash.subjectName}) pada jam ini.`.replace(
          /\s+/g,
          " ",
        ),
      });
    }
  }

  return conflicts;
}

/**
 * Rekap pemenuhan JP — dihitung dari jadwal nyata, tidak pernah dari status
 * yang disimpan terpisah. Ini yang mencegah "KPI hijau padahal grid kosong".
 */
export function computeJpProgress(
  assignments: TeachingAssignment[],
  entries: ScheduleEntry[],
): JpProgress[] {
  const counted = new Map<string, number>();
  for (const e of entries) {
    counted.set(
      e.teachingAssignmentId,
      (counted.get(e.teachingAssignmentId) ?? 0) + 1,
    );
  }

  return assignments
    .filter((a) => a.status === "active")
    .map((a) => {
      const scheduled = counted.get(a.id) ?? 0;
      return {
        teachingAssignmentId: a.id,
        teacherName: a.teacherName,
        subjectName: a.subjectName,
        className: a.className,
        subjectColorKey: a.subjectColorKey,
        targetJp: a.targetJp,
        scheduledJp: scheduled,
        remainingJp: a.targetJp - scheduled,
        status: jpStatus(a.targetJp, scheduled),
      };
    });
}
