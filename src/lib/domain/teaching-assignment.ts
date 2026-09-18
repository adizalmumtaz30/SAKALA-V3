export type TeachingAssignmentStatus = "active" | "inactive";

/**
 * Internally "Teaching Assignment" (Bagian 93). Operator never sees this name —
 * the UI always calls it "Beban Mengajar" (Bagian 18-19, LOCKED).
 * Target JP is distinct from Scheduled/Realized JP (Bagian 20) — this table only
 * ever holds the target; scheduling reads it, never writes back into it.
 */
export interface TeachingAssignment {
  id: string;
  academicYearId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  targetJp: number;
  status: TeachingAssignmentStatus;
  notes: string | null;
  // Denormalized for display — populated by the data-access join, not stored.
  teacherName: string;
  subjectName: string;
  subjectColorKey: string | null;
  className: string;
}
