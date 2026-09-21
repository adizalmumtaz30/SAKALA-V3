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
      entries.filter((e) => e.classId === classId && e.day === day).map((e) => e.periodNumber),
    );
    const ordinals = slots
      .map((slot) => ({ slot, ordinal: activeOrdinalMap(timeSlots).get(`${slot.day}__${slot.periodNumber}`)! }))
      .filter(({ slot }) => occupied.has(slot.periodNumber))
      .map(({ ordinal }) => ordinal);
    if (ordinals.length < 2) continue;
    const first = Math.min(...ordinals);
    const last = Math.max(...ordinals);
    total += Math.max(0, last - first + 1 - ordinals.length);
  }
  return total;
}

function daySpan(entries: ScheduleEntry[], classId: string, timeSlots: TimeSlot[]) {
  const ordinals = activeOrdinalMap(timeSlots);
  let total = 0;
  for (const slots of activeSlotsByDay(timeSlots).values()) {
    const values = entries
      .filter((e) => e.classId === classId)
      .filter((e) => e.day === slots[0]?.day)
      .map((e) => ordinals.get(`${e.day}__${e.periodNumber}`))
      .filter((v): v is number => v !== undefined);
    if (values.length >= 2) total += Math.max(...values) - Math.min(...values);
  }
  return total;
}

function brokenContinuity(
  entries: ScheduleEntry[],
  classId: string,
  timeSlots: TimeSlot[],
) {
  const ordinals = activeOrdinalMap(timeSlots);
  let total = 0;
  const assignmentIds = new Set(
    entries.filter((e) => e.classId === classId).map((e) => e.teachingAssignmentId),
  );
  for (const assignmentId of assignmentIds) {
    for (const day of DAYS as Day[]) {
      const values = entries
        .filter((e) => e.classId === classId && e.teachingAssignmentId === assignmentId && e.day === day)
        .map((e) => ordinals.get(`${e.day}__${e.periodNumber}`))
        .filter((v): v is number => v !== undefined)
        .sort((a, b) => a - b);
      for (let i = 1; i < values.length; i += 1) {
        if (values[i] !== values[i - 1] + 1) total += 1;
      }
    }
  }
  return total;
}

function dailyImbalance(entries: ScheduleEntry[], classId: string, timeSlots: TimeSlot[]) {
  const days = [...activeSlotsByDay(timeSlots).keys()];
  const counts = days.map((day) =>
    entries.filter((e) => e.classId === classId && e.day === day).length,
  );
  if (counts.length === 0) return 0;
  const average = counts.reduce((sum, value) => sum + value, 0) / counts.length;
  return counts.reduce((sum, value) => sum + Math.abs(value - average), 0);
}

function subjectDistribution(entries: ScheduleEntry[], classId: string) {
  let penalty = 0;
  const byAssignmentDay = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (entry.classId !== classId) continue;
    const days = byAssignmentDay.get(entry.teachingAssignmentId) ?? new Set<string>();
    days.add(entry.day);
    byAssignmentDay.set(entry.teachingAssignmentId, days);
  }
  for (const days of byAssignmentDay.values()) {
    if (days.size === 1) penalty += 1;
  }
  return penalty;
}

function teacherDistribution(entries: ScheduleEntry[], classId: string, timeSlots: TimeSlot[]) {
  const days = [...activeSlotsByDay(timeSlots).keys()];
  let penalty = 0;
  const teachers = new Set(entries.filter((e) => e.classId === classId).map((e) => e.teacherId));
  for (const teacherId of teachers) {
    const counts = days.map((day) =>
      entries.filter((e) => e.teacherId === teacherId && e.day === day).length,
    );
    if (counts.length === 0) continue;
    const average = counts.reduce((sum, value) => sum + value, 0) / counts.length;
    penalty += counts.reduce((sum, value) => sum + Math.abs(value - average), 0);
  }
  return penalty;
}

export function scoreSchedule(state: ScheduleState): ObjectiveVector {
  return [
    internalGapCount(state.entries, state.classId, state.timeSlots),
    daySpan(state.entries, state.classId, state.timeSlots),
    brokenContinuity(state.entries, state.classId, state.timeSlots),
    dailyImbalance(state.entries, state.classId, state.timeSlots),
    subjectDistribution(state.entries, state.classId),
    teacherDistribution(state.entries, state.classId, state.timeSlots),
  ];
}

function isProtected(entry: ScheduleEntry, movableIds: Set<string>) {
  return entry.locked || entry.source !== "auto" || !movableIds.has(entry.id);
}

function candidateConflicts(
  entry: ScheduleEntry,
  to: SlotPosition,
  entries: ScheduleEntry[],
  maxConsecutiveJp: number | null,
  ignoredIds: Set<string>,
) {
  return findConflicts(
    {
      day: to.day,
      periodNumber: to.periodNumber,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      classId: entry.classId,
      className: entry.className,
      roomId: entry.roomId,
      roomName: entry.roomName,
    },
    entries.filter((item) => !ignoredIds.has(item.id)),
    maxConsecutiveJp,
  );
}

function applyOperation(entries: ScheduleEntry[], operation: OptimizationOperation) {
  if (operation.kind === "move") {
    return entries.map((entry) =>
      entry.id === operation.move.entryId
        ? { ...entry, day: operation.move.to.day, periodNumber: operation.move.to.periodNumber }
        : entry,
    );
  }

  return entries.map((entry) => {
    if (entry.id === operation.swap.firstEntryId) {
      return { ...entry, day: operation.swap.secondFrom.day, periodNumber: operation.swap.secondFrom.periodNumber };
    }
    if (entry.id === operation.swap.secondEntryId) {
      return { ...entry, day: operation.swap.firstFrom.day, periodNumber: operation.swap.firstFrom.periodNumber };
    }
    return entry;
  });
}

function validateOperation(
  state: ScheduleState,
  operation: OptimizationOperation,
  movableIds: Set<string>,
) {
  const entries = state.entries;
  if (operation.kind === "move") {
    const entry = entries.find((item) => item.id === operation.move.entryId);
    if (!entry || isProtected(entry, movableIds)) return false;
    if (entries.some((item) => item.id !== entry.id && item.classId === state.classId && item.day === operation.move.to.day && item.periodNumber === operation.move.to.periodNumber)) return false;
    if (!activeSlotsByDay(state.timeSlots).get(operation.move.to.day)?.some((slot) => slot.periodNumber === operation.move.to.periodNumber)) return false;
    return candidateConflicts(entry, operation.move.to, entries, state.maxConsecutiveJp, new Set([entry.id])).length === 0;
  }

  const first = entries.find((item) => item.id === operation.swap.firstEntryId);
  const second = entries.find((item) => item.id === operation.swap.secondEntryId);
  if (!first || !second || first.id === second.id) return false;
  if (isProtected(first, movableIds) || isProtected(second, movableIds)) return false;
  if (first.classId !== state.classId || second.classId !== state.classId) return false;

  const ignored = new Set([first.id, second.id]);
  return (
    activeSlotsByDay(state.timeSlots).get(operation.swap.secondFrom.day)?.some((slot) => slot.periodNumber === operation.swap.secondFrom.periodNumber) === true &&
    activeSlotsByDay(state.timeSlots).get(operation.swap.firstFrom.day)?.some((slot) => slot.periodNumber === operation.swap.firstFrom.periodNumber) === true &&
    candidateConflicts(first, operation.swap.secondFrom, entries, state.maxConsecutiveJp, ignored).length === 0 &&
    candidateConflicts(second, operation.swap.firstFrom, entries, state.maxConsecutiveJp, ignored).length === 0
  );
}

function candidateMoves(state: ScheduleState, movableIds: Set<string>) {
  const slots = [...activeSlotsByDay(state.timeSlots).entries()].flatMap(([, values]) => values);
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
