import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/domain/attendance";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/domain/attendance";

export interface TeacherWorkloadSummary {
  teacherId: string;
  teacherName: string;
  totalJp: number;
  subjectCount: number;
  classCount: number;
}

/**
 * Rekap Beban Mengajar per Guru (Bagian 74). Sums Target JP only — this is
 * the assigned target, never Scheduled/Realized JP (Bagian 20), since the
 * Scheduling Engine doesn't exist yet.
 */
export function summarizeWorkloadByTeacher(
  assignments: TeachingAssignment[],
): TeacherWorkloadSummary[] {
  const map = new Map<string, TeacherWorkloadSummary>();

  for (const a of assignments.filter((x) => x.status === "active")) {
    const existing = map.get(a.teacherId);
    const subjects = new Set<string>();
    const classes = new Set<string>();
    if (existing) {
      existing.totalJp += a.targetJp;
    } else {
      map.set(a.teacherId, {
        teacherId: a.teacherId,
        teacherName: a.teacherName,
        totalJp: a.targetJp,
        subjectCount: 0,
        classCount: 0,
      });
    }
    subjects.add(a.subjectId);
    classes.add(a.classId);
  }

  // Second pass for distinct subject/class counts (kept simple & correct
  // rather than clever single-pass set bookkeeping).
  for (const summary of map.values()) {
    const rows = assignments.filter(
      (a) => a.status === "active" && a.teacherId === summary.teacherId,
    );
    summary.subjectCount = new Set(rows.map((r) => r.subjectId)).size;
    summary.classCount = new Set(rows.map((r) => r.classId)).size;
  }

  return Array.from(map.values()).sort((a, b) => b.totalJp - a.totalJp);
}

export interface ClassWorkloadSummary {
  classId: string;
  className: string;
  totalJp: number;
  subjectCount: number;
}

export function summarizeWorkloadByClass(
  assignments: TeachingAssignment[],
): ClassWorkloadSummary[] {
  const map = new Map<string, ClassWorkloadSummary>();

  for (const a of assignments.filter((x) => x.status === "active")) {
    const existing = map.get(a.classId);
    if (existing) {
      existing.totalJp += a.targetJp;
    } else {
      map.set(a.classId, {
        classId: a.classId,
        className: a.className,
        totalJp: a.targetJp,
        subjectCount: 0,
      });
    }
  }
  for (const summary of map.values()) {
    const rows = assignments.filter(
      (a) => a.status === "active" && a.classId === summary.classId,
    );
    summary.subjectCount = new Set(rows.map((r) => r.subjectId)).size;
  }

  return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className));
}

export interface AttendanceSummary {
  teacherId: string;
  teacherName: string;
  counts: Record<AttendanceStatus, number>;
}

/** Rekap Absensi per Guru untuk rentang tanggal yang sudah difilter di query. */
export function summarizeAttendanceByTeacher(
  records: AttendanceRecord[],
): AttendanceSummary[] {
  const map = new Map<string, AttendanceSummary>();

  for (const r of records) {
    let entry = map.get(r.teacherId);
    if (!entry) {
      entry = {
        teacherId: r.teacherId,
        teacherName: r.teacherName,
        counts: Object.fromEntries(
          Object.keys(ATTENDANCE_STATUS_LABEL).map((k) => [k, 0]),
        ) as Record<AttendanceStatus, number>,
      };
      map.set(r.teacherId, entry);
    }
    entry.counts[r.status] += 1;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.teacherName.localeCompare(b.teacherName),
  );
}
