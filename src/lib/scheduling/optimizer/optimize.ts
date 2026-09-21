import type { ScheduleState, OptimizationResult, ScheduleCandidate, ObjectiveVector, CandidateMove, SlotPosition } from "@/lib/scheduling/types/schedule-state";
import { findConflicts } from "@/lib/application/schedule-conflict";
import type { Day } from "@/lib/domain/time-structure";
import { applyCandidate } from "./apply-candidate";
import { generateMoveCandidates, generateSwapCandidates } from "./generate-candidates";
import { scoreSchedule, compareObjective } from "./score-schedule";



type MoveChain = CandidateMove[];

function mutableEntry(state: ScheduleState, id: string) {
  const entry = state.entries.find((item) => item.id === id);
  return entry && entry.source === "auto" && !entry.locked && state.mutableEntryIds.has(id) ? entry : null;
}

function chainAllowedEntry(state: ScheduleState, entry: ScheduleState["entries"][number]) {
  return entry.source === "auto" && !entry.locked && state.mutableEntryIds.has(entry.id) &&
    (state.scope.type === "full-week" || entry.classId === state.scope.classId);
}

function directMove(state: ScheduleState, entry: ScheduleState["entries"][number], to: SlotPosition): CandidateMove | null {
  if (!chainAllowedEntry(state, entry)) return null;
  if (entry.day === to.day && entry.periodNumber === to.periodNumber) return null;
  const slot = state.timeSlots.find((item) => item.day === to.day && item.periodNumber === to.periodNumber && item.status === "active" && item.type === "mengajar");
  if (!slot) return null;
  const conflicts = findConflicts({
    day: to.day,
    periodNumber: to.periodNumber,
    teacherId: entry.teacherId,
    teacherName: entry.teacherName,
    classId: entry.classId,
    className: entry.className,
    roomId: entry.roomId,
    roomName: entry.roomName,
    ignoreEntryId: entry.id,
  }, state.entries, state.maxConsecutiveJp);
  if (conflicts.length) return null;
  return {
    kind: "move", entryId: entry.id,
    from: { day: entry.day as Day, periodNumber: entry.periodNumber },
    to,
    objective: scoreSchedule(state),
  };
}

function blockersAt(state: ScheduleState, entry: ScheduleState["entries"][number], to: SlotPosition) {
  return state.entries.filter((other) => {
    if (other.id === entry.id) return false;
    if (other.day !== to.day || other.periodNumber !== to.periodNumber) return false;
    return other.classId === entry.classId || other.teacherId === entry.teacherId ||
      (!!entry.roomId && !!other.roomId && other.roomId === entry.roomId);
  });
}

function findRelocationChain(
  state: ScheduleState,
  entryId: string,
  to: SlotPosition,
  depth: number,
  visiting: Set<string>,
): MoveChain | null {
  const entry = mutableEntry(state, entryId);
  if (!entry || !chainAllowedEntry(state, entry) || visiting.has(entry.id)) return null;

  const direct = directMove(state, entry, to);
  if (direct) return [direct];
  if (depth <= 0) return null;

  const blockers = blockersAt(state, entry, to).filter((item) => chainAllowedEntry(state, item));
  if (blockers.length === 0) return null;

  const nextVisiting = new Set(visiting);
  nextVisiting.add(entry.id);

  const slots = state.timeSlots
    .filter((slot) => slot.status === "active" && slot.type === "mengajar")
    .sort((a, b) => a.periodNumber - b.periodNumber || String(a.day).localeCompare(String(b.day)));

  // A target slot can be blocked by more than one hard constraint at once
  // (for example, class + teacher). Try every movable blocker instead of
  // assuming the first row is the only useful chain.
  for (const blocked of blockers) {
    for (const slot of slots) {
      if (slot.day === blocked.day && slot.periodNumber === blocked.periodNumber) continue;
      const blockerMove = findRelocationChain(
        state,
        blocked.id,
        { day: slot.day as Day, periodNumber: slot.periodNumber },
        depth - 1,
        nextVisiting,
      );
      if (!blockerMove) continue;

      let intermediate = state;
      for (const move of blockerMove) intermediate = applyCandidate(intermediate, move);
      const finalMove = directMove(intermediate, entry, to);
      if (!finalMove) continue;
      return [...blockerMove, finalMove];
    }
  }

  return null;
}

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

  // Jadwal yang sudah tersimpan boleh membawa pelanggaran lama.
  // Optimizer tetap berjalan: hard conflict tetap prioritas tertinggi,
  // sehingga ia tidak boleh memperburuk konflik, tetapi masih dapat
  // memperbaiki kualitas (termasuk internal gap) pada state yang ada.
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
      // Relocation-chain fallback: when the desired gap is occupied by a
      // teacher conflict, a simple Move/Swap is insufficient. Recursively
      // relocate the blocker (bounded depth) and then place the target entry
      // into the gap. This keeps the public contracts Move/Swap while allowing
      // a deterministic multi-move solution internally.
      const gaps = Array.from(
        new Set(
          state.entries
            .filter((entry) => entry.classId === state.scope.classId)
            .flatMap((entry) => {
              const classPeriods = state.entries
                .filter((item) => item.classId === state.scope.classId && item.day === entry.day)
                .map((item) => item.periodNumber);
              if (classPeriods.length < 2) return [];
              const first = Math.min(...classPeriods);
              const last = Math.max(...classPeriods);
              return state.timeSlots
                .filter(
                  (slot) =>
                    slot.status === "active" &&
                    slot.type === "mengajar" &&
                    slot.day === entry.day &&
                    slot.periodNumber > first &&
                    slot.periodNumber < last &&
                    !classPeriods.includes(slot.periodNumber),
                )
                .map((slot) => JSON.stringify({ day: slot.day as Day, periodNumber: slot.periodNumber }));
            }),
        ),
      ).map((value) => JSON.parse(value) as SlotPosition);

      let bestChain: MoveChain | null = null;
      let bestChainObjective = objective;
      const chainSeeds = state.entries.filter((entry) => entry.classId === state.scope.classId && chainAllowedEntry(state, entry));

      for (const seed of chainSeeds.slice(0, 80)) {
        for (const gap of gaps.slice(0, 80)) {
          const chain = findRelocationChain(state, seed.id, gap, 4, new Set());
          if (!chain) continue;
          let candidateState = state;
          for (const move of chain) candidateState = applyCandidate(candidateState, move);
          const candidateObjective = scoreSchedule(candidateState);
          if (compareObjective(candidateObjective, objective) < 0 && compareObjective(candidateObjective, bestChainObjective) < 0) {
            bestChain = chain;
            bestChainObjective = candidateObjective;
          }
        }
      }

      if (bestChain) {
        for (const move of bestChain) {
          state = applyCandidate(state, move);
          if (move.kind === "move") movesAccepted += 1;
          else swapsAccepted += 1;
          iterations += 1;
          if (iterations >= maxIterations) break;
        }
        objective = scoreSchedule(state);
        continue;
      }

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
