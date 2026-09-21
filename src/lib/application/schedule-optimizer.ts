import { findConflicts } from "@/lib/application/schedule-conflict";
import type { ScheduleEntry } from "@/lib/domain/schedule";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { TimeSlot, Day } from "@/lib/domain/time-structure";
import { DAYS } from "@/lib/domain/time-structure";
import type { AutoFillPlacement } from "@/lib/application/schedule-autofill";

export type SlotPosition = Pick<ScheduleEntry, "day" | "periodNumber">;

export type ObjectiveVector = [
  internalGaps: number,
  daySpan: number,
  brokenContinuity: number,
  dailyImbalance: number,
  subjectDistribution: number,
  teacherDistribution: number,
];

export type ScheduleMove = {
  kind: "move";
  entryId: string;
  from: SlotPosition;
  to: SlotPosition;
};

export type ScheduleSwap = {
  kind: "swap";
  firstEntryId: string;
  secondEntryId: string;
  firstFrom: SlotPosition;
  secondFrom: SlotPosition;
};

export type OptimizationOperation =
  | { kind: "move"; move: ScheduleMove }
  | { kind: "swap"; swap: ScheduleSwap };

export interface OptimizationResult {
  entries: ScheduleEntry[];
  placements: AutoFillPlacement[];
  initialObjective: ObjectiveVector;
  finalObjective: ObjectiveVector;
  movesAccepted: number;
  swapsAccepted: number;
  iterations: number;
  stoppedReason: "no-improvement" | "iteration-cap";
}

export interface ScheduleState {
  entries: ScheduleEntry[];
  assignments: TeachingAssignment[];
  timeSlots: TimeSlot[];
  classId: string;
  maxConsecutiveJp: number | null;
}

function compareObjective(a: ObjectiveVector, b: ObjectiveVector): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

function activeSlotsByDay(timeSlots: TimeSlot[]) {
  const result = new Map<Day, TimeSlot[]>();
  for (const slot of timeSlots) {
    if (slot.status !== "active" || slot.type !== "mengajar") continue;
    const list = result.get(slot.day as Day) ?? [];
    list.push(slot);
    result.set(slot.day as Day, list);
  }
  for (const list of result.values()) {
    list.sort((a, b) => a.periodNumber - b.periodNumber);
  }
  return result;
}

function activeOrdinalMap(timeSlots: TimeSlot[]) {
  const map = new Map<string, number>();
  for (const slots of activeSlotsByDay(timeSlots).values()) {
    slots.forEach((slot, index) => map.set(`${slot.day}__${slot.periodNumber}`, index));
  }
  return map;
}

function internalGapCount(entries: ScheduleEntry[], classId: string, timeSlots: TimeSlot[]) {
  let total = 0;
  for (const [day, slots] of activeSlotsByDay(timeSlots)) {
    const occupied = new Set(
    state.entries
      .filter((e) => e.classId === state.classId)
      .map((e) => `${e.day}__${e.periodNumber}`),
  );
  const result: OptimizationOperation[] = [];
  for (const entry of state.entries) {
    if (entry.classId !== state.classId || isProtected(entry, movableIds)) continue;
    for (const slot of slots) {
      const key = `${slot.day}__${slot.periodNumber}`;
      if (occupied.has(key)) continue;
      result.push({
        kind: "move",
        move: {
          kind: "move",
          entryId: entry.id,
          from: { day: entry.day as Day, periodNumber: entry.periodNumber },
          to: { day: slot.day as Day, periodNumber: slot.periodNumber },
        },
      });
    }
  }
  return result;
}

function candidateSwaps(state: ScheduleState, movableIds: Set<string>) {
  const movable = state.entries.filter(
    (entry) => entry.classId === state.classId && !isProtected(entry, movableIds),
  );
  const result: OptimizationOperation[] = [];
  for (let i = 0; i < movable.length; i += 1) {
    for (let j = i + 1; j < movable.length; j += 1) {
      const first = movable[i];
      const second = movable[j];
      result.push({
        kind: "swap",
        swap: {
          kind: "swap",
          firstEntryId: first.id,
          secondEntryId: second.id,
          firstFrom: { day: first.day as Day, periodNumber: first.periodNumber },
          secondFrom: { day: second.day as Day, periodNumber: second.periodNumber },
        },
      });
    }
  }
  return result;
}

export function optimizeSchedule(input: {
  state: ScheduleState;
  movableEntryIds: Set<string>;
  placements: AutoFillPlacement[];
  maxIterations?: number;
}): OptimizationResult {
  let state = { ...input.state, entries: [...input.state.entries] };
  const initialObjective = scoreSchedule(state);
  let currentObjective = initialObjective;
  let movesAccepted = 0;
  let swapsAccepted = 0;
  let iterations = 0;
  const maxIterations = input.maxIterations ?? Math.max(100, input.movableEntryIds.size * 10);

  while (iterations < maxIterations) {
    let best:
      | { operation: OptimizationOperation; objective: ObjectiveVector; entries: ScheduleEntry[] }
      | undefined;

    const operations = [...candidateMoves(state, input.movableEntryIds), ...candidateSwaps(state, input.movableEntryIds)];
    for (const operation of operations) {
      if (!validateOperation(state, operation, input.movableEntryIds)) continue;
      const simulatedEntries = applyOperation(state.entries, operation);
      const objective = scoreSchedule({ ...state, entries: simulatedEntries });
      if (compareObjective(objective, currentObjective) >= 0) continue;
      if (!best || compareObjective(objective, best.objective) < 0) {
        best = { operation, objective, entries: simulatedEntries };
      }
    }

    if (!best) {
      return {
        entries: state.entries,
        placements: syncPlacements(input.placements, state.entries),
        initialObjective,
        finalObjective: currentObjective,
        movesAccepted,
        swapsAccepted,
        iterations,
        stoppedReason: "no-improvement",
      };
    }

    state = { ...state, entries: best.entries };
    currentObjective = best.objective;
    if (best.operation.kind === "move") movesAccepted += 1;
    else swapsAccepted += 1;
    iterations += 1;
  }

  return {
    entries: state.entries,
    placements: syncPlacements(bestPlacements(input.placements, state.entries)),
    initialObjective,
    finalObjective: currentObjective,
    movesAccepted,
    swapsAccepted,
    iterations,
    stoppedReason: "iteration-cap",
  };
}

function syncPlacements(placements: AutoFillPlacement[], entries: ScheduleEntry[]) {
  return placements.map((placement, index) => {
    const pendingId = `pending-${index + 1}`;
    const entry = entries.find((item) => item.id === pendingId);
    return entry
      ? { ...placement, day: entry.day as Day, periodNumber: entry.periodNumber }
      : placement;
  });
}
