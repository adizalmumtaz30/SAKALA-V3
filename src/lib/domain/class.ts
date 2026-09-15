export type ClassStatus = "active" | "inactive";

export interface SchoolClass {
  id: string;
  academicYearId: string;
  grade: string | null;
  name: string;
  code: string | null;
  capacity: number | null;
  status: ClassStatus;
}
