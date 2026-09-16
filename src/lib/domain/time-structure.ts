export type Day = "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu";

export const DAYS: Day[] = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

export const DAY_LABEL: Record<Day, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
};

/**
 * TYPE = KEGIATAN + LABEL, never a type-per-activity like "upacara" or
 * "religi" (Bagian 26, LOCKED) — keeps the type set small and lets the
 * engine treat every non-teaching activity uniformly.
 */
export type TimeSlotType = "mengajar" | "kegiatan" | "istirahat" | "nonaktif";

export type TimeSlotStatus = "active" | "inactive";

export interface TimeSlot {
  id: string;
  academicYearId: string;
  day: Day;
  periodNumber: number;
  startTime: string; // "HH:MM:SS"
  endTime: string;
  type: TimeSlotType;
  activityLabel: string | null;
  status: TimeSlotStatus;
}
