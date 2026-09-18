"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  /** Dampak nyata, bukan "Apakah Anda yakin?" generik (Bagian D.12, LOCKED). */
  impactLines: string[];
  confirmLabel: string;
  tone?: "warning" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  impactLines,
  confirmLabel,
  tone = "warning",
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const accent =
    tone === "danger" ? "text-status-blocked" : "text-status-attention";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm [animation:drawer-fade-in_180ms_ease-out]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-hairline-strong bg-surface-overlay shadow-2xl [animation:dialog-in_220ms_cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex items-start gap-3 px-5 pt-5">
          <AlertTriangle size={17} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${accent}`} />
          <h2 className="text-[14px] font-medium text-ink">{title}</h2>
        </div>

        <ul className="mt-3 space-y-1.5 px-5">
          {impactLines.map((line, i) => (
            <li key={i} className="text-[12.5px] leading-relaxed text-ink-muted">
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end gap-2 border-t border-hairline px-5 py-3.5">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium text-canvas transition-opacity disabled:opacity-60 ${
              tone === "danger" ? "bg-status-blocked" : "bg-status-attention"
            }`}
          >
            {pending ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
