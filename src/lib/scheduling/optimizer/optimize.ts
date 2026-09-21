import type { ScheduleState, OptimizationResult, ScheduleCandidate, ObjectiveVector } from "@/lib/scheduling/types/schedule-state";
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

    let best: ScheduleCandidate | undefined = candidates[0];

    // Depth-2 lookahead: a single move may keep the same gap count while
    // making a second move possible. This is the key case that defeated the
    // old repair pass (contoh: P3, P5, P6 -> P3, P4, P5 needs two moves).
    if (!best || compareObjective(best.objective, objective) >= 0) {
      const neutral = [
        ...generateMoveCandidates(state, { onlyImproving: false }),
        ...generateSwapCandidates(state, { onlyImproving: false }),
      ].filter((candidate) => compareObjective(candidate.objective, objective) >= 0);

      let bestLookahead: { first: ScheduleCandidate; second: ScheduleCandidate; objective: ObjectiveVector } | undefined;

      for (const first of neutral.slice(0, 250)) {
        const intermediate = applyCandidate(state, first);
        const secondCandidates = [
          ...generateMoveCandidates(intermediate),
          ...generateSwapCandidates(intermediate),
        ];
        for (const second of secondCandidates) {
          if (!bestLookahead || compareObjective(second.objective, bestLookahead.objective) < 0) {
            bestLookahead = { first, second, objective: second.objective };
          }
        }
      }

      if (bestLookahead && compareObjective(bestLookahead.objective, objective) < 0) {
        // Execute the two contracts as two deterministic optimizer steps.
        state = applyCandidate(state, bestLookahead.first);
        objective = scoreSchedule(state);
        if (bestLookahead.first.kind === "move") movesAccepted += 1;
        else swapsAccepted += 1;
        iterations += 1;
        if (iterations >= maxIterations) break;

        state = applyCandidate(state, bestLookahead.second);
        objective = bestLookahead.objective;
        if (bestLookahead.second.kind === "move") movesAccepted += 1;
        else swapsAccepted += 1;
        iterations += 1;
        continue;
      }

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
