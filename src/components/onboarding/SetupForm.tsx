"use client";

import { useActionState } from "react";
import {
  createSchoolAction,
  createAcademicYearAction,
  type SetupFormState,
} from "@/lib/application/setup.actions";

const initialState: SetupFormState = {};

export function CreateSchoolForm() {
  const [state, formAction, pending] = useActionState(
    createSchoolAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Nama Sekolah
        </label>
        <input
          name="schoolName"
          required
          placeholder="Contoh: MTs. Darut Tafsir Al-Husaini"
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
        />
      </div>
      {state.error && (
        <p className="text-[12.5px] text-status-blocked">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan Sekolah"}
      </button>
    </form>
  );
}

export function CreateAcademicYearForm({ schoolId }: { schoolId: string }) {
  const [state, formAction, pending] = useActionState(
    createAcademicYearAction,
    initialState,
  );
  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Tahun Mulai
        </label>
        <input
          name="startYear"
          type="number"
          required
          defaultValue={currentYear}
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
        />
      </div>
      {state.error && (
        <p className="text-[12.5px] text-status-blocked">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Aktifkan Tahun Ajaran"}
      </button>
    </form>
  );
}
