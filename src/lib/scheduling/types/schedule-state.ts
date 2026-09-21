import type { ScheduleEntry } from "@/lib/domain/schedule";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { Day, TimeSlot } from "@/lib/domain/time-structure";

export type ScheduleScope =
  | { type: "class"; classId: string }
  | { type: "full-week"; classId: string };

export interface SlotPosition {
  day: Day;
  periodNumber: number;
}

export interface ScheduleState {
  entries: ScheduleEntry[];
  assignments: TeachingAssignment[];
  timeSlots: TimeSlot[];
  maxConsecutiveJp: number | null;
  scope: ScheduleScope;
}

export type ObjectiveVector = [
  hardConflicts: number,
  targetShortfall: number,
  internalGaps: number,
  daySpan: number,
  brokenContinuity: number,
  dailyImbalance: number,
  subjectDistribution: number,
  teacherDistribution: number,
  preferencePenalty: number,
];

export interface CandidateMove {
  kind: "move";
  entryId: string;
  from: SlotPosition;
  to: SlotPosition;
  objective: ObjectiveVector;
}

export interface CandidateSwap {
  kind: "swap";
  firstEntryId: string;
  secondEntryId: string;
  firstFrom: SlotPosition;
  secondFrom: SlotPosition;
  objective: ObjectiveVector;
}

export type ScheduleCandidate = CandidateMove | CandidateSwap;

export interface OptimizationResult {
  state: ScheduleState;
  initialObjective: ObjectiveVector;
  finalObjective: ObjectiveVector;
  movesAccepted: number;
  swapsAccepted: number;
  iterations: number;
  stoppedReason:
    | "no-improvement"
    | "max-iterations"
    | "target-reached"
    | "invalid-initial-state";
  remainingShortfall: number;
  remainingInternalGaps: number;
  remainingConflicts: number;
}
