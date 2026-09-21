import type { ScheduleState, ScheduleCandidate } from "@/lib/scheduling/types/schedule-state";

export function applyCandidate(
  state: ScheduleState,
  candidate: ScheduleCandidate,
): ScheduleState {
  const entries = state.entries.map((entry) => {
    if (candidate.kind === "move" && entry.id === candidate.entryId) {
      return { ...entry, day: candidate.to.day, periodNumber: candidate.to.periodNumber };
    }
    if (candidate.kind === "swap") {
      if (entry.id === candidate.firstEntryId) {
        return { ...entry, day: candidate.secondFrom.day, periodNumber: candidate.secondFrom.periodNumber };
      }
      if (entry.id === candidate.secondEntryId) {
        return { ...entry, day: candidate.firstFrom.day, periodNumber: candidate.firstFrom.periodNumber };
      }
    }
    return entry;
  });
  return { ...state, entries };
}
