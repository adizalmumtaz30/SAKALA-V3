/**
 * SCHEDULE ENGINE — model domain.
 *
 * Satu ScheduleEntry = satu Beban Mengajar yang ditempatkan pada satu slot
 * waktu. Kelas tidak disimpan ulang di sini; kelas melekat pada Beban
 * Mengajar, dan menduplikasinya membuka peluang data yang saling
 * bertentangan (Bagian 20 — penjadwalan membaca target JP, tidak pernah
 * menulis baliknya).
 */
export interface ScheduleEntry {
  id: string;
  academicYearId: string;
  timeSlotId: string;
  teachingAssignmentId: string;
  roomId: string | null;

  // Didenormalisasi oleh join di data-access untuk keperluan tampilan —
  // tidak disimpan di tabel.
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  subjectColorKey: string | null;
  classId: string;
  className: string;
  roomName: string | null;

  // Posisi slot, ikut dibawa supaya deteksi bentrok tidak perlu query ulang.
  day: string;
  periodNumber: number;
}

/**
 * Rekap pemenuhan target JP per Beban Mengajar. Dihitung, tidak disimpan —
 * supaya tidak pernah ada dua sumber kebenaran yang bisa berbeda (pelajaran
 * dari insiden V2: KPI hijau padahal grid kosong).
 */
export interface JpProgress {
  teachingAssignmentId: string;
  teacherName: string;
  subjectName: string;
  className: string;
  subjectColorKey: string | null;
  targetJp: number;
  scheduledJp: number;
  /** Positif = masih kurang, negatif = kelebihan tempat. */
  remainingJp: number;
  status: "belum" | "sebagian" | "lengkap" | "lebih";
}

export function jpStatus(target: number, scheduled: number): JpProgress["status"] {
  if (scheduled === 0) return "belum";
  if (scheduled < target) return "sebagian";
  if (scheduled === target) return "lengkap";
  return "lebih";
}

export const JP_STATUS_LABEL: Record<JpProgress["status"], string> = {
  belum: "Belum dijadwalkan",
  sebagian: "Sebagian",
  lengkap: "Lengkap",
  lebih: "Melebihi target",
};
