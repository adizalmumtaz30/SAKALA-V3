import type { ScheduleState, OptimizationResult, ScheduleCandidate } from "@/lib/scheduling/types/schedule-state";
import { applyCandidate } from "./apply-candidate";
import { generateMoveCandidates, generateSwapCandidates } from "./generate-candidates";
import { scoreSchedule, compareObjective } from "./score-schedule";

export function optimizeSchedule(
  initialState: ScheduleState,
  options: { maxIterations?: number } = {},
): OptimizationResult {
  const maxIterations = options.maxIterations ?? Math.max(50, initialState.entries.length * 4);
  let state = initialState;
  const initialObjective = scoreSchedule(state);
  let objective = initialObjective;
  let iterations = 0;
  let movesAccepted = 0;
  let swapsAccepted = 0;

  if (objective[0] > 0) {
    return {
      state,
      initialObjective,
      finalObjective: objective,
      movesAccepted,
      swapsAccepted,
      iterations,
      stoppedReason: "invalid-initial-state",
      remainingShortfall: objective[1],
      remainingInternalGaps: objective[2],
      remainingConflicts: objective[0],
    };
  }

  while (iterations < maxIterations) {
    if (objective[1] === 0 && objective[2] === 0) {
      return {
        state,
        initialObjective,
        finalObjective: objective,
        movesAccepted,
        swapsAccepted,
        iterations,
        stoppedReason: "target-reached",
        remainingShortfall: 0,
        remainingInternalGaps: 0,
        remainingConflicts: 0,
      };
    }

    const candidates = [
      ...generateMoveCandidates(state),
      ...generateSwapCandidates(state),
    ].sort((a, b) => compareObjective(a.objective, b.objective));

    const best = candidates[0];
    if (!best || compareObjective(best.objective, objective) >= 0) {
      return {
        state,
        initialObjective,
        finalObjective: objective,
        movesAccepted,
        swapsAccepted,
        iterations,
        stoppedReason: "no-improvement",
        remainingShortfall: objective[1],
        remainingInternalGaps: objective[2],
        remainingConflicts: objective[0],
      };
    }

    state = applyCandidate(state, best);
    objective = best.objective;
    if (best.kind === "move") movesAccepted += 1;
    else swapsAccepted += 1;
    iterations += 1;
  }

  return {
    state,
    initialObjective,
    finalObjective: objective,
    movesAccepted,
    swapsAccepted,
    iterations,
    stoppedReason: "max-iterations",
    remainingShortfall: objective[1],
    remainingInternalGaps: objective[2],
    remainingConflicts: objective[0],
  };
}
