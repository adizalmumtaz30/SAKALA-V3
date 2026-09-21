"use client";

import { useActionState } from "react";
import { Wrench } from "lucide-react";
import { repairScheduleGapsAction, type ScheduleGapRepairState } from "@/lib/application/schedule.actions";

const initialState: ScheduleGapRepairState = {};

export function RepairScheduleGapsButton({
  academicYearId,
}: {
  academicYearId: string;
}) {
  const [state, action, pending] = useActionState(
    repairScheduleGapsAction,
    initialState,
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <input type="hidden" name="academicYearId" value={academicYearId} />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12.5px] font-medium text-ink-muted hover:border-accent-teal hover:text-ink disabled:cursor-wait disabled:opacity-60"
          title="Cari dan perbaiki jam kosong di tengah jadwal tanpa menghapus jadwal"
        >
          <Wrench size={14} strokeWidth={1.75} />
          {pending ? "Memperbaiki…" : "Perbaiki Jam Lompat"}
        </button>
      </form>

      {state.error && (
        <p className="max-w-[360px] text-right text-[12px] text-red-600">
          {state.error}
        </p>
      )}

      {state.result && (
        <p className="max-w-[420px] text-right text-[12px] text-ink-muted">
          Gap {state.result.initialInternalGaps} → {state.result.finalInternalGaps};
          {" "}{state.result.persistedEntries} entri dipindah;
          {" "}{state.result.movesAccepted} move + {state.result.swapsAccepted} swap;
          {" "}{state.result.verified ? "database terverifikasi." : "belum terverifikasi."}
        </p>
      )}
    </div>
  );
}
