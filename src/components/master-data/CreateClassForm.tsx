"use client";

import { useActionState } from "react";
import {
  createClassAction,
  type FormState,
} from "@/lib/application/master-data.actions";

const initialState: FormState = {};

export function CreateClassForm({ academicYearId }: { academicYearId: string }) {
  const [state, formAction, pending] = useActionState(
    createClassAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <div className="flex-1">
        <input
          name="name"
          required
          placeholder="Contoh: VII A"
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
        />
        {state.error && (
          <p className="mt-1.5 text-[12px] text-status-blocked">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-accent-teal px-4 py-2.5 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Tambah Kelas"}
      </button>
    </form>
  );
}
