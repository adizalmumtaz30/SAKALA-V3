"use client";

import { useActionState } from "react";
import {
  generateTimeStructureAction,
  type FormState,
} from "@/lib/application/time-structure.actions";
import { DAYS, DAY_LABEL } from "@/lib/domain/time-structure";

const initialState: FormState = {};

export function GenerateTimeStructureForm({
  academicYearId,
}: {
  academicYearId: string;
}) {
  const [state, formAction, pending] = useActionState(
    generateTimeStructureAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="academicYearId" value={academicYearId} />

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Hari Efektif
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <label
              key={day}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] text-ink-muted has-checked:border-accent-teal has-checked:text-ink"
            >
              <input
                type="checkbox"
                name="days"
                value={day}
                defaultChecked={day !== "sabtu"}
                className="accent-accent-teal"
              />
              {DAY_LABEL[day]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div>
          <label className="mb-1.5 block text-[12.5px] text-ink-muted">
            Jumlah Periode
          </label>
          <input
            name="periodCount"
            type="number"
            min={1}
            required
            defaultValue={8}
            className="w-28 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] text-ink-muted">
            Jam Mulai
          </label>
          <input
            name="startTime"
            type="time"
            required
            defaultValue="07:00"
            className="rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] text-ink-muted">
            Durasi / JP (menit)
          </label>
          <input
            name="durationMinutes"
            type="number"
            min={1}
            required
            defaultValue={40}
            className="w-28 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
          />
        </div>
      </div>

      <p className="text-[12px] text-ink-faint">
        Semua periode dibuat sebagai slot Mengajar terlebih dahulu. Tandai
        istirahat/kegiatan/non-aktif setelahnya di daftar di bawah.
      </p>

      {state.error && (
        <p className="text-[12.5px] text-status-blocked">{state.error}</p>
      )}
      {state.success && (
        <p className="text-[12.5px] text-status-ready">✓ {state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Membuat…" : "Buat Struktur Waktu"}
      </button>
    </form>
  );
}
