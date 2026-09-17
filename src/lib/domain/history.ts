/**
 * Audit trail (Bagian 67, 93, LOCKED). Own module, not Settings — history is
 * operational reference, not configuration.
 */
export interface HistoryEntry {
  id: string;
  academicYearId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  summary: string;
  actor: string;
  createdAt: string;
}
