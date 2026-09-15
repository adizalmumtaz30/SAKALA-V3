export type SchoolStatus = "active" | "inactive";

export interface School {
  id: string;
  schoolName: string;
  shortName: string | null;
  address: string | null;
  schoolCode: string | null;
  logoUrl: string | null;
  status: SchoolStatus;
}
