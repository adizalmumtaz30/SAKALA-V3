"use client";

import { useActionState } from "react";
import {
  updateSchoolProfileAction,
  type FormState,
} from "@/lib/application/settings.actions";
import type { School } from "@/lib/domain/school";

const initialState: FormState = {};

export function SchoolProfileForm({ school }: { school: School }) {
  const [state, formAction, pending] = useActionState(
    updateSchoolProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={school.id} />

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Nama Sekolah
        </label>
        <input
          name="schoolName"
          required
          defaultValue={school.schoolName}
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Nama Singkat
        </label>
        <input
          name="shortName"
          defaultValue={school.shortName ?? ""}
          placeholder="Contoh: MTs Darut Tafsir"
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Alamat
        </label>
        <input
          name="address"
          defaultValue={school.address ?? ""}
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] text-ink-muted">
          Kode Sekolah
        </label>
        <input
          name="schoolCode"
          defaultValue={school.schoolCode ?? ""}
          className="w-48 rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-accent-teal"
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
