export type SubjectStatus = "active" | "inactive";

export interface Subject {
  id: string;
  code: string | null;
  name: string;
  shortName: string | null;
  category: string | null;
  status: SubjectStatus;
  notes: string | null;
}
