"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/application/master-data.actions";

const initial: FormState = {};

export function SchedulingRulesForm({
  academicYearId,
  currentMax,
  action,
}: {
  academicYearId: string;
  currentMax: number | null;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="academicYearId" value={academicYearId} />

      <div>
        <label className="block text-[13px] font-medium text-ink">
          Batas JP mengajar berturut-turut
        </label>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          Satu guru tidak boleh dijadwalkan lebih dari sekian jam mengajar
          tersambung dalam satu hari (tanpa jeda). Dicek otomatis saat
          menempatkan atau memindah pelajaran di Kanvas Jadwal.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            name="maxConsecutiveJp"
            type="number"
            min={1}
            defaultValue={currentMax ?? ""}
            placeholder="Tidak dibatasi"
            className="w-28 rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent-teal"
          />
          <span className="text-[12.5px] text-ink-muted">JP</span>
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">
          Kosongkan untuk menonaktifkan batas ini.
        </p>
      </div>

      {state.error && (
        <p className="text-[12.5px] text-status-blocked">{state.error}</p>
      )}
      {state.success && (
        <p className="text-[12.5px] text-status-ready">✓ {state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan Aturan"}
      </button>
    </form>
  );
}
