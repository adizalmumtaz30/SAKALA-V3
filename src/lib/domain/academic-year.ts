/**
 * Academic Year lifecycle and workspace-context are deliberately separate
 * concepts (Phase 10.4 — Academic Context Governance, locked):
 *
 *   Lifecycle:        "what is this year's state of life?"      draft | active | archived
 *   Workspace context: "which year is the operator using now?"  isWorkspaceSelected
 *
 * ACTIVE !== SELECTED. Only one year per school may be isWorkspaceSelected.
 */
export type AcademicYearLifecycle = "draft" | "active" | "archived";

export interface AcademicYear {
  id: string;
  schoolId: string;
  startYear: number;
  endYear: number;
  label: string; // e.g. "2026/2027"
  startDate: string | null;
  endDate: string | null;
  lifecycle: AcademicYearLifecycle;
  isWorkspaceSelected: boolean;
  /** Bagian D.1 — batas JP mengajar berturut-turut per guru per hari.
   *  null = tidak dibatasi. */
  maxConsecutiveJp: number | null;
}
