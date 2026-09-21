import { findConflicts } from "@/lib/application/schedule-conflict";
import { DAYS } from "@/lib/domain/time-structure";
import type { Day, TimeSlot } from "@/lib/domain/time-structure";
import type { ScheduleState, ObjectiveVector } from "@/lib/scheduling/types/schedule-state";

const slotKey = (day: string, period: number) => `${day}__${period}`;

function teachingSlots(state: ScheduleState): TimeSlot[] {
  return state.timeSlots.filter(
    (slot) => slot.status === "active" && slot.type === "mengajar",
  );
}

function scopedEntries(state: ScheduleState) {
  const { scope } = state;
  if (scope.type === "class" || scope.type === "full-week") {
    return state.entries.filter((entry) => entry.classId === scope.classId);
  }
  return state.entries;
}

function targetShortfall(state: ScheduleState): number {
  const entries = scopedEntries(state);
  const relevant = state.assignments.filter(
    (a) => a.status === "active" &&
      (a.classId === state.scope.classId),
  );
  return relevant.reduce((sum, assignment) => {
    const scheduled = entries.filter(
      (entry) => entry.teachingAssignmentId === assignment.id,
    ).length;
    return sum + Math.max(0, assignment.targetJp - scheduled);
  }, 0);
}

function internalGaps(state: ScheduleState): number {
  const entries = scopedEntries(state);
  const teaching = teachingSlots(state);
  let total = 0;

  for (const day of DAYS) {
    const occupied = new Set(
      entries.filter((entry) => entry.day === day).map((entry) => entry.periodNumber),
    );
    if (occupied.size < 2) continue;
    const first = Math.min(...occupied);
    const last = Math.max(...occupied);
    for (const slot of teaching) {
      if (
        slot.day === day &&
        slot.periodNumber > first &&
        slot.periodNumber < last &&
        !occupied.has(slot.periodNumber)
      ) total += 1;
    }
  }
  return total;
}

function hardConflicts(state: ScheduleState): number {
  let total = 0;
  for (const entry of state.entries) {
    const conflicts = findConflicts(
      {
        day: entry.day as Day,
        periodNumber: entry.periodNumber,
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
    if (conflicts.length > 0) total += conflicts.length;
  }
  return total;
}

function daySpan(state: ScheduleState): number {
  const entries = scopedEntries(state);
  return DAYS.reduce((sum, day) => {
    const periods = entries.filter((entry) => entry.day === day).map((entry) => entry.periodNumber);
    return periods.length < 2 ? sum : sum + Math.max(...periods) - Math.min(...periods);
  }, 0);
}

function brokenContinuity(state: ScheduleState): number {
  const entries = scopedEntries(state);
  let total = 0;
  for (const assignment of state.assignments.filter((a) => a.status === "active" && a.classId === state.scope.classId)) {
    for (const day of DAYS) {
      const periods = entries
        .filter((entry) => entry.teachingAssignmentId === assignment.id && entry.day === day)
        .map((entry) => entry.periodNumber)
        .sort((a, b) => a - b);
      if (periods.length < 2) continue;
      for (let i = 1; i < periods.length; i += 1) {
        if (periods[i] !== periods[i - 1] + 1) total += 1;
      }
    }
  }
  return total;
}

function dailyImbalance(state: ScheduleState): number {
  const entries = scopedEntries(state);
  const counts = DAYS.map((day) => entries.filter((entry) => entry.day === day).length);
  const activeDays = counts.filter((count) => count > 0);
  if (activeDays.length < 2) return 0;
  const mean = activeDays.reduce((a, b) => a + b, 0) / activeDays.length;
  return activeDays.reduce((sum, count) => sum + Math.abs(count - mean), 0);
}

function subjectDistribution(state: ScheduleState): number {
  const entries = scopedEntries(state);
  let penalty = 0;
  for (const subjectId of new Set(entries.map((e) => e.subjectId))) {
    for (const day of DAYS) {
      const count = entries.filter((e) => e.subjectId === subjectId && e.day === day).length;
      if (count > 2) penalty += count - 2;
    }
  }
  return penalty;
}

function preferencePenalty(state: ScheduleState): number {
  const scoped = scopedEntries(state);
  let penalty = 0;
  for (const assignment of state.assignments.filter((a) => a.status === "active" && a.classId === state.scope.classId)) {
    const days = new Set(scoped.filter((entry) => entry.teachingAssignmentId === assignment.id).map((entry) => entry.day));
    if (state.spreadPreference === "concentrated") penalty += Math.max(0, days.size - 1);
    else if (state.spreadPreference === "spread") penalty += Math.max(0, assignment.targetJp - days.size);
    // balanced is intentionally neutral here; the generator already balances day usage.
  }
  return penalty;
}

function teacherDistribution(state: ScheduleState): number {
  let penalty = 0;
  for (const teacherId of new Set(state.entries.map((e) => e.teacherId))) {
    const daily = DAYS.map((day) => state.entries.filter((e) => e.teacherId === teacherId && e.day === day).length);
    const nonZero = daily.filter(Boolean);
    if (nonZero.length > 1) {
      const mean = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
      penalty += nonZero.reduce((sum, count) => sum + Math.abs(count - mean), 0);
    }
  }
  return penalty;
}

export function scoreSchedule(state: ScheduleState): ObjectiveVector {
  return [
    hardConflicts(state),
    targetShortfall(state),
    internalGaps(state),
    daySpan(state),
    brokenContinuity(state),
    dailyImbalance(state),
    subjectDistribution(state),
    teacherDistribution(state),
    preferencePenalty(state),
  ];
}

export function compareObjective(a: ObjectiveVector, b: ObjectiveVector): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}
