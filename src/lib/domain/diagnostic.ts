/**
 * Validation / Dependency Layer (Bagian 83, LOCKED): the "sistem saraf" that
 * runs across every core, not a separate menu. Output is always human
 * language with a concrete recommended action — never a technical error
 * code (Bagian 53, 108).
 */
export type DiagnosticSeverity = "attention" | "blocked";

export interface DiagnosticIssue {
  severity: DiagnosticSeverity;
  message: string;
  href: string;
  actionLabel: string;
}
