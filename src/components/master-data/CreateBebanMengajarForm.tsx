"use client";

import { useActionState } from "react";
import {
  createBebanMengajarAction,
  type FormState,
} from "@/lib/application/teaching-assignment.actions";
import type { Teacher } from "@/lib/domain/teacher";
import type { Subject } from "@/lib/domain/subject";
import type { SchoolClass } from "@/lib/domain/class";

const initialState: FormState = {};

interface CreateBebanMengajarFormProps {
  academicYearId: string;
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
}

export function CreateBebanMengajarForm({
  academicYearId,
  teachers,
  subjects,
  classes,
}: CreateBebanMengajarFormProps) {
  const [state, formAction, pending] = useActionState(
    createBebanMengajarAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="academicYearId" value={academicYearId} />

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Guru
        </label>
        <select
          name="teacherId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
        >
          <option value="" disabled>
            Pilih guru
          </option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Mata Pelajaran
        </label>
        <select
          name="subjectId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
        >
          <option value="" disabled>
            Pilih mata pelajaran
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Kelas{" "}
          <span className="text-ink-faint">
            (pilih lebih dari satu bila JP-nya sama)
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] text-ink-muted has-checked:border-accent-teal has-checked:text-ink"
            >
              <input
                type="checkbox"
                name="classIds"
                value={c.id}
                className="accent-accent-teal"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          JP / Minggu
        </label>
        <input
          name="targetJp"
          type="number"
          min={1}
          required
          defaultValue={2}
          className="w-28 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
        />
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
        className="rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
