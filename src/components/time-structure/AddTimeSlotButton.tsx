"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { appendTimeSlotAction } from "@/lib/application/time-structure.actions";
import type { FormState } from "@/lib/application/time-structure.actions";
import type { Day } from "@/lib/domain/time-structure";

const initial: FormState = {};

export function AddTimeSlotButton({
  academicYearId,
  day,
}: {
  academicYearId: string;
  day: Day;
}) {
  const [state, formAction, pending] = useActionState(appendTimeSlotAction, initial);

  return (
    <form action={formAction} className="flex items-center gap-2 px-4 py-2.5">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="durationMinutes" value={40} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-hairline-strong px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-accent-teal hover:text-accent-teal disabled:opacity-50"
      >
        <Plus size={13} strokeWidth={2} />
        {pending ? "Menambah…" : "Tambah Jam ke-"}
      </button>
      {state.error && <span className="text-[11.5px] text-status-blocked">{state.error}</span>}
    </form>
  );
}
