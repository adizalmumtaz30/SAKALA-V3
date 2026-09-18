export type SubjectStatus = "active" | "inactive";

export interface Subject {
  id: string;
  code: string | null;
  name: string;
  shortName: string | null;
  category: string | null;
  status: SubjectStatus;
  notes: string | null;
  /** Identitas warna tunggal (Bagian E.1.2) — key dari IDENTITY_COLORS. */
  colorKey: string | null;
}
