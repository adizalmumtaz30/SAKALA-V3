/**
 * SCHEDULE ENGINE — model domain.
 *
 * Satu ScheduleEntry = satu Beban Mengajar yang ditempatkan pada satu
 * hari + jam ke-. Posisi (day, periodNumber) dan teacher/subject/class
 * disimpan LANGSUNG di baris ini (bukan cuma lewat FK ke
 * teachingAssignmentId) — desain ini datang dari skema yang sudah live di
 * database, bukan pilihan saya: dengan begitu bentrok guru/kelas pada jam
 * yang sama bisa ditegakkan sebagai UNIQUE CONSTRAINT oleh database
 * sendiri (no_teacher_clash, no_class_clash), lapisan pertahanan yang
 * tidak bisa dilewati siapa pun — di atas pengecekan aplikasi yang
 * memberi pesan bahasa operator sebelum constraint itu sempat tersentuh.
 */
export type ScheduleSource = "manual" | "auto";

export interface ScheduleEntry {
  id: string;
  academicYearId: string;
  teachingAssignmentId: string;
  roomId: string | null;

  teacherId: string;
  subjectId: string;
  classId: string;
  day: string;
  periodNumber: number;

  /** 'auto' disediakan untuk penjadwal otomatis di masa depan — TIDAK
   *  dipakai/dibangun di sini (AI Scheduling dikecualikan). */
  source: ScheduleSource;
  /** true = tidak boleh ditimpa proses otomatis apa pun nanti. Penempatan
   *  manual selalu locked sejak dibuat. */
  locked: boolean;

  // Didenormalisasi oleh join di data-access untuk keperluan tampilan —
  // tidak disimpan di kolomnya sendiri.
  teacherName: string;
  subjectName: string;
  subjectColorKey: string | null;
  className: string;
  roomName: string | null;
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
