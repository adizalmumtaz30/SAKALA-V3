export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha" | "dinas";

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
  dinas: "Dinas",
};

/**
 * ABSENSI IS OPTIONAL AND INDEPENDENT (LOCKED). No schedule_id, no
 * assignment, no target JP. A teacher can be HADIR with zero classes
 * scheduled that day — attendance never mutates or reads the schedule.
 */
export interface AttendanceRecord {
  id: string;
  academicYearId: string;
  teacherId: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  note: string | null;
  teacherName: string;
}
