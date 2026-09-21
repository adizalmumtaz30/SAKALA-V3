import type { ScheduleState, ScheduleCandidate } from "@/lib/scheduling/types/schedule-state";
import { scoreSchedule, compareObjective } from "./score-schedule";
import { findConflicts } from "@/lib/application/schedule-conflict";
import type { Day } from "@/lib/domain/time-structure";

function movable(entry: ScheduleState["entries"][number]) {
  return entry.source === "auto" && !entry.locked;
}

function occupiedAt(state: ScheduleState, day: Day, periodNumber: number, ignoredIds: Set<string> = new Set()) {
  return state.entries.some(
    (entry) =>
      !ignoredIds.has(entry.id) &&
      entry.day === day &&
      entry.periodNumber === periodNumber,
  );
}

function validEntryAt(state: ScheduleState, entry: ScheduleState["entries"][number], day: Day, periodNumber: number, ignoredIds: Set<string>) {
  const slot = state.timeSlots.find(
    (candidate) =>
      candidate.day === day &&
      candidate.periodNumber === periodNumber &&
      candidate.status === "active" &&
      candidate.type === "mengajar",
  );
  if (!slot) return false;
  if (occupiedAt(state, day, periodNumber, ignoredIds)) return false;

  const conflicts = findConflicts(
    {
      day,
      periodNumber,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      classId: entry.classId,
      className: entry.className,
      roomId: entry.roomId,
      roomName: entry.roomName,
      ignoreEntryId: entry.id,
    },
    state.entries,
    state.maxConsecutiveJp,
  );
  return conflicts.length === 0;
}

export function generateMoveCandidates(state: ScheduleState): ScheduleCandidate[] {
  const base = scoreSchedule(state);
  const candidates: ScheduleCandidate[] = [];
  const movableEntries = state.entries.filter((entry) => movable(entry) && entry.classId === state.scope.classId);
  const teachingSlots = state.timeSlots.filter(
    (slot) => slot.status === "active" && slot.type === "mengajar",
  );

  for (const entry of movableEntries) {
    for (const slot of teachingSlots) {
      if (entry.day === slot.day && entry.periodNumber === slot.periodNumber) continue;
      if (!validEntryAt(state, entry, slot.day, slot.periodNumber, new Set([entry.id]))) continue;

      const nextEntries = state.entries.map((item) =>
        item.id === entry.id ? { ...item, day: slot.day, periodNumber: slot.periodNumber } : item,
      );
      const nextState = { ...state, entries: nextEntries };
      const objective = scoreSchedule(nextState);
      if (compareObjective(objective, base) < 0) {
        candidates.push({
          kind: "move",
          entryId: entry.id,
          from: { day: entry.day as Day, periodNumber: entry.periodNumber },
          to: { day: slot.day, periodNumber: slot.periodNumber },
          objective,
        });
      }
    }
  }

  return candidates;
}

export function generateSwapCandidates(state: ScheduleState): ScheduleCandidate[] {
  const base = scoreSchedule(state);
  const candidates: ScheduleCandidate[] = [];
  const scopedMovableEntries = state.entries.filter((entry) => movable(entry) && entry.classId === state.scope.classId);
  const allMovableEntries = state.entries.filter(movable);

  for (let i = 0; i < scopedMovableEntries.length; i += 1) {
    for (let j = 0; j < allMovableEntries.length; j += 1) {
      const first = scopedMovableEntries[i];
      const second = allMovableEntries[j];
      if (!first || first.id === second.id) continue;
      if (first.day === second.day && first.periodNumber === second.periodNumber) continue;

      const nextEntries = state.entries.map((entry) => {
        if (entry.id === first.id) return { ...entry, day: second.day, periodNumber: second.periodNumber };
        if (entry.id === second.id) return { ...entry, day: first.day, periodNumber: first.periodNumber };
        return entry;
      });
      const nextState = { ...state, entries: nextEntries };
      if (scoreSchedule(nextState)[0] > 0) continue;
      const objective = scoreSchedule(nextState);
      if (compareObjective(objective, base) < 0) {
        candidates.push({
          kind: "swap",
          firstEntryId: first.id,
          secondEntryId: second.id,
          firstFrom: { day: first.day as Day, periodNumber: first.periodNumber },
          secondFrom: { day: second.day as Day, periodNumber: second.periodNumber },
          objective,
        });
      }
    }
  }

  return candidates;
}
