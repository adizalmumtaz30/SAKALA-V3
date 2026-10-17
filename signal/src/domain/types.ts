// SIGNAL domain types — dipakai bersama oleh validator, generator, API, dan UI.

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_LABEL: Record<DayOfWeek, string> = {
  MON: 'Senin', TUE: 'Selasa', WED: 'Rabu', THU: 'Kamis', FRI: 'Jumat', SAT: 'Sabtu',
};

export type SlotType = 'TEACHING' | 'BREAK' | 'NON_TEACHING';

export interface TimeSlot {
  slotId: string;
  slotOrder: number;
  slotType: SlotType;
  label?: string;
  isActive: boolean;
}

export interface DayStructure {
  day: DayOfWeek;
  maxTeachingPeriods: number;
  slots: TimeSlot[]; // slotOrder menaik; BREAK bukan JP KBM
}

export interface Teacher {
  teacherId: string;
  teacherCode: string;
  fullName: string;
  isActive: boolean;
}

export interface Subject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  isActive: boolean;
}

export interface ClassEntity {
  classId: string;
  className: string;
  isActive: boolean;
}

export interface Qualification {
  teacherId: string;
  subjectId: string;
  status: 'APPROVED' | 'PENDING' | 'REVOKED';
}

export interface Requirement {
  requirementId: string;
  classId: string;
  subjectId: string;
  weeklyJP: number;
}

export interface Allocation {
  requirementId: string;
  teacherId: string;
  allocatedJP: number;
}

export interface TeacherLimit {
  teacherId: string;
  maxWeeklyJP: number;
  targetWeeklyJP?: number | null;
  maxDailyJP?: number | null;
}

export interface ScheduleEntry {
  entryId: string;
  classId: string;
  day: DayOfWeek;
  slotOrder: number;
  subjectId: string;
  teacherId: string;
  requirementId: string;
}

export interface ValidationIssue {
  ruleCode: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  isHardConstraint: boolean;
  message: string;
  relatedIds?: string[];
  location?: { classId?: string; day?: DayOfWeek; slotOrder?: number; teacherId?: string };
}

export type GeneratorStatus =
  | 'SUCCESS'
  | 'INFEASIBLE'
  | 'SEARCH_LIMIT_REACHED'
  | 'INVALID_INPUT';

export interface GeneratorInput {
  periodId: string;
  classes: ClassEntity[];
  teachers: Teacher[];
  subjects: Subject[];
  qualifications: Qualification[];
  days: DayStructure[];
  requirements: Requirement[];
  allocations: Allocation[];
  limits: TeacherLimit[];
}

export interface GeneratorResult {
  status: GeneratorStatus;
  candidates: ScheduleEntry[][]; // kandidat valid (sudah lewat validator independen)
  attempts: number;
  placed: number;
  stopReason: string | null;
  diagnostics: string[];
  inputFingerprint: string;
}
