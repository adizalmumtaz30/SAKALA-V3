"use client";

import { useState, useTransition } from "react";
import { CheckSquare, X } from "lucide-react";
import type { BulkResult } from "@/lib/application/master-data.actions";

/**
 * Bagian VI.4 — Aksi massal.
 *
 * Bilah ini HANYA muncul saat ada baris terpilih — tampilan normal (tanpa
 * seleksi) tidak berubah sama sekali. Prinsip "sedikit klik" berlaku dua
 * arah: menambah kemampuan ini tidak boleh menambah friksi ke alur yang
 * sudah ada untuk operator yang tidak sedang butuh aksi massal.
 */
export function BulkActionBar({
  selectedIds,
  onClear,
  onActivate,
  onDeactivate,
}: {
  selectedIds: string[];
  onClear: () => void;
  onActivate: (ids: string[]) => Promise<BulkResult>;
  onDeactivate: (ids: string[]) => Promise<BulkResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (selectedIds.length === 0) return null;

  const run = (action: (ids: string[]) => Promise<BulkResult>) => {
    startTransition(async () => {
      const result = await action(selectedIds);
      setMessage(result.error ?? result.success ?? null);
      if (!result.error) onClear();
    });
  };

  return (
    <div
      data-print="hide"
      className="sticky top-2 z-30 mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-hairline-strong bg-surface-overlay px-4 py-2.5 shadow-lg backdrop-blur-md animate-[dialog-in_180ms_cubic-bezier(0.16,0.8,0.24,1)]"
    >
      <CheckSquare size={15} strokeWidth={1.75} className="shrink-0 text-accent-teal" />
      <p className="text-[12.5px] text-ink">
        <span className="font-medium">{selectedIds.length}</span> terpilih
      </p>

      {message && <p className="text-[12px] text-ink-muted">{message}</p>}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => run(onActivate)}
          disabled={pending}
          className="rounded-lg border border-hairline-strong px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          Aktifkan
        </button>
        <button
          onClick={() => run(onDeactivate)}
          disabled={pending}
          className="rounded-lg border border-hairline-strong px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-status-blocked/40 hover:text-status-blocked disabled:opacity-50"
        >
          {pending ? "Memproses…" : "Nonaktifkan"}
        </button>
        <button
          onClick={onClear}
          aria-label="Batalkan pilihan"
          className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-focus hover:text-ink"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
