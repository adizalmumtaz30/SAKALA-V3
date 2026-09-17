"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import {
  importTeachersAction,
  type ImportFormState,
} from "@/lib/application/import.actions";
import { parseNamesFromCsv } from "@/lib/application/csv";

const initialState: ImportFormState = {};

export function ImportTeachersForm() {
  const [names, setNames] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    importTeachersAction,
    initialState,
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setNames(parseNamesFromCsv(text));
    setFileName(file.name);
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-strong bg-surface px-4 py-6 text-[13px] text-ink-muted hover:text-ink">
        <Upload size={16} strokeWidth={1.75} />
        {fileName ?? "Pilih file CSV (kolom \"nama\")"}
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      </label>

      {names.length > 0 && (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="names" value={names.join("\n")} />

          <div className="rounded-lg border border-hairline bg-surface p-3">
            <p className="text-[12px] text-ink-muted">
              Ditemukan {names.length} nama:
            </p>
            <ul className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto text-[12.5px] text-ink">
              {names.slice(0, 10).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            {names.length > 10 && (
              <p className="mt-1 text-[11.5px] text-ink-faint">
                +{names.length - 10} lainnya
              </p>
            )}
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
            {pending ? "Mengimpor…" : `Impor ${names.length} Guru`}
          </button>
        </form>
      )}
    </div>
  );
}
