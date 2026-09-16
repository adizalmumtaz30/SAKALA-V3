"use client";

import { useState, useActionState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import type { AcademicYear } from "@/lib/domain/academic-year";
import {
  switchAcademicYearAction,
  createDraftAcademicYearAction,
  type FormState,
} from "@/lib/application/academic-context.actions";

const LIFECYCLE_LABEL: Record<AcademicYear["lifecycle"], string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

const initialState: FormState = {};

function YearRow({ year, schoolId }: { year: AcademicYear; schoolId: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-[13.5px] text-ink">{year.label}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[11px] text-ink-faint">
            {LIFECYCLE_LABEL[year.lifecycle]}
          </span>
          {year.isWorkspaceSelected && (
            <span className="text-[11px] text-status-ready">
              · Sedang digunakan
            </span>
          )}
        </div>
      </div>
      {!year.isWorkspaceSelected && (
        <form action={switchAcademicYearAction}>
          <input type="hidden" name="schoolId" value={schoolId} />
          <input type="hidden" name="targetYearId" value={year.id} />
          <button
            type="submit"
            className="text-[12px] text-accent-teal hover:underline"
          >
            Gunakan
          </button>
        </form>
      )}
    </div>
  );
}

function AddYearForm({ schoolId }: { schoolId: string }) {
  const [state, formAction, pending] = useActionState(
    createDraftAcademicYearAction,
    initialState,
  );
  const nextYear = new Date().getFullYear() + 1;

  return (
    <form action={formAction} className="flex items-start gap-2 p-4">
      <input type="hidden" name="schoolId" value={schoolId} />
      <input
        name="startYear"
        type="number"
        required
        defaultValue={nextYear}
        className="w-24 rounded-lg border border-hairline-strong bg-surface px-2.5 py-2 text-[12.5px] text-ink outline-none focus:border-accent-teal"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-hairline-strong px-3 py-2 text-[12px] text-ink-muted hover:text-ink disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Siapkan Tahun Ajaran (Draft)"}
      </button>
      {state.error && (
        <p className="text-[11.5px] text-status-blocked">{state.error}</p>
      )}
    </form>
  );
}

export function AcademicContextTrigger({
  schoolId,
  academicYear,
  academicYears,
}: {
  schoolId: string;
  academicYear: AcademicYear | null;
  academicYears: AcademicYear[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 leading-tight transition-colors hover:bg-surface-elevated"
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[9.5px] font-medium tracking-wide text-ink-faint">
            TAHUN PELAJARAN
          </span>
          {academicYear ? (
            <span className="text-[13px] text-ink">{academicYear.label}</span>
          ) : (
            <span className="text-[13px] text-status-incomplete">
              Belum dipilih
            </span>
          )}
        </div>
        <ChevronDown size={13} strokeWidth={1.75} className="text-ink-faint" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-6 top-16 w-80 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <h2 className="text-[13px] font-medium text-ink">
                Konteks Akademik
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-faint hover:text-ink"
              >
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <div className="max-h-72 divide-y divide-hairline overflow-y-auto">
              {academicYears.map((year) => (
                <YearRow key={year.id} year={year} schoolId={schoolId} />
              ))}
            </div>
            <div className="border-t border-hairline">
              <AddYearForm schoolId={schoolId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
