export type PersonStatus = "active" | "inactive";

export interface Teacher {
  id: string;
  teacherCode: string | null;
  employeeNumber: string | null;
  name: string;
  shortName: string | null;
  gender: "L" | "P" | null;
  phone: string | null;
  email: string | null;
  status: PersonStatus;
  notes: string | null;
}
