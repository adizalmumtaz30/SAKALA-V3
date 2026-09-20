"use client";

import { useState, useTransition } from "react";
import { Sparkles, ChevronDown, CheckCircle2, AlertTriangle } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  autoFillScheduleAction,
  type AutoFillActionState,
} from "@/lib/application/schedule.actions";

type Mode = "fill-empty" | "full-week";

/**
 * JADWAL OTOMATIS — pemicu deterministik (bukan AI), segmented ke kelas
 * yang sedang dipilih di perspektif Kelas.
 *
 * Server action dipanggil LANGSUNG sebagai fungsi (bukan lewat
 * useActionState) karena alurnya bercabang sebelum submit (pilih mode ->
 * kalau "1 minggu penuh" perlu konfirmasi destruktif dulu) — pola wizard
 * begini lebih pas dengan state lokal daripada dispatch form tunggal.
 */
export function AutoScheduleButton({
  academicYearId,
  classId,
  className,
}: {
  academicYearId: string;
  classId: string;
  className: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmMode, setConfirmMode] = useState<Mode | null>(null);
  const [result, setResult] = useState<AutoFillActionState["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(mode: Mode) {
    setConfirmMode(null);
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("academicYearId", academicYearId);
      formData.set("classId", classId);
      formData.set("mode", mode);
      const state = await autoFillScheduleAction({}, formData);
      if (state.error) setError(state.error);
      else if (state.result) setResult(state.result);
    });
  }

  function selectMode(mode: Mode) {
    // "Set 1 minggu penuh" bersifat destruktif (menghapus jadwal kelas ini
    // yang sudah ada) — konfirmasi eksplisit dengan dampak nyata, bukan
    // "Apakah Anda yakin?" generik (Bagian D.12, LOCKED).
    if (mode === "full-week") setConfirmMode(mode);
    else run(mode);
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            disabled={pending}
            data-print="hide"
            className="flex items-center gap-1.5 rounded-lg bg-accent-teal px-3 py-1.5 text-[12.5px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
          >
            <Sparkles size={14} strokeWidth={2} />
            {pending ? "Menjadwalkan…" : "Jadwal Otomatis"}
            <ChevronDown size={13} strokeWidth={2} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-40 w-72 rounded-xl border border-hairline-strong bg-surface-overlay p-1.5 shadow-2xl"
          >
            <DropdownMenu.Item
              onSelect={() => selectMode("fill-empty")}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-[12.5px] text-ink outline-none transition-colors data-[highlighted]:bg-surface-focus"
            >
              <p className="font-medium">Lengkapi slot kosong</p>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                Hanya mengisi jam yang masih kosong untuk {className}. Yang
                sudah terisi tidak disentuh.
              </p>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => selectMode("full-week")}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-[12.5px] text-ink outline-none transition-colors data-[highlighted]:bg-surface-focus"
            >
              <p className="font-medium">Set jadwal satu minggu penuh</p>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                Menghapus jadwal {className} yang sudah ada, lalu mengisi
                ulang dari awal.
              </p>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {confirmMode === "full-week" && (
        <ConfirmDialog
          title={`Set ulang jadwal ${className}?`}
          impactLines={[
            `Seluruh jadwal ${className} yang sudah ada — baik yang ditempatkan manual maupun otomatis — akan DIHAPUS.`,
            "Setelah itu, seluruh Beban Mengajar kelas ini diisi ulang dari awal secara otomatis.",
            "Aksi ini tidak bisa dibatalkan begitu diproses.",
          ]}
          confirmLabel="Ya, Set Ulang"
          tone="danger"
          pending={pending}
          onConfirm={() => run("full-week")}
          onCancel={() => setConfirmMode(null)}
        />
      )}

      {error && (
        <div className="fixed bottom-5 right-5 z-40 max-w-xs rounded-xl border border-status-blocked/30 bg-surface-overlay p-3 shadow-xl">
          <p className="text-[12.5px] text-status-blocked">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1.5 text-[11.5px] text-ink-muted hover:text-ink"
          >
            Tutup
          </button>
        </div>
      )}

      {result && (
        <Drawer
          title={`Hasil Jadwal Otomatis — ${result.className}`}
          onClose={() => setResult(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 rounded-xl border border-status-ready/30 bg-status-ready/[0.08] px-3.5 py-3">
              <CheckCircle2 size={16} strokeWidth={2} className="shrink-0 text-status-ready" />
              <p className="text-[12.5px] text-ink">
                {result.placedCount} pelajaran berhasil ditempatkan
                {result.mode === "full-week" && result.deletedCount > 0
                  ? ` (${result.deletedCount} entri lama dihapus lebih dulu)`
                  : ""}
                .
              </p>
            </div>

            {result.shortfalls.length > 0 && (
              <section>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  <AlertTriangle size={12} strokeWidth={2} className="text-status-incomplete" />
                  Belum terisi penuh ({result.shortfalls.length})
                </p>
                <div className="space-y-2">
                  {result.shortfalls.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-hairline bg-surface px-3.5 py-3"
                    >
                      <p className="text-[12.5px] font-medium text-ink">
                        {s.subjectName} — {s.teacherName}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-status-incomplete">
                        Terisi {s.filledJp}/{s.targetJp} JP — kurang {s.remainingJp}
                      </p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
                        {s.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.relatedIssues.length > 0 && (
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  Kemungkinan penyebab — perlu diperbaiki
                </p>
                <div className="space-y-2">
                  {result.relatedIssues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-3.5 py-2.5"
                    >
                      <p className="min-w-0 flex-1 text-[12px] text-ink">{issue.message}</p>
                      <a
                        href={issue.href}
                        className="shrink-0 rounded-lg border border-hairline-strong px-2.5 py-1 text-[11.5px] text-ink-muted transition-colors hover:text-ink"
                      >
                        {issue.actionLabel}
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.shortfalls.length === 0 && result.relatedIssues.length === 0 && (
              <p className="text-[12.5px] text-ink-muted">
                Semua target JP {result.className} sudah terpenuhi penuh.
              </p>
            )}
          </div>
        </Drawer>
      )}
    </>
  );
}
