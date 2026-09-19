"use client";

import { useActionState, useMemo, useState } from "react";
import { Trash2, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import {
  assignScheduleAction,
  moveScheduleEntryAction,
  removeScheduleEntryAction,
  type ScheduleActionState,
} from "@/lib/application/schedule.actions";
import { getIdentityColor } from "@/lib/domain/identity-color";
import { DAY_LABEL, type Day, type TimeSlot } from "@/lib/domain/time-structure";
import type { ScheduleEntry, JpProgress } from "@/lib/domain/schedule";

const initial: ScheduleActionState = {};

interface SlotEditorProps {
  academicYearId: string;
  slot: TimeSlot;
  /** Penempatan yang sudah ada di slot ini (bisa lebih dari satu kelas). */
  entries: ScheduleEntry[];
  /** Beban Mengajar yang bisa dipilih, sudah dilengkapi sisa JP. */
  progress: JpProgress[];
  rooms: { id: string; name: string }[];
  /** Slot mengajar lain, untuk tujuan pindah jam. */
  moveTargets: TimeSlot[];
  onClose: () => void;
}

function ConflictNotice({ messages }: { messages: string[] }) {
  return (
    <div className="rounded-xl border border-status-blocked/30 bg-status-blocked/[0.07] p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-medium text-status-blocked">
        <AlertTriangle size={13} strokeWidth={2} />
        Tidak bisa ditempatkan di jam ini
      </p>
      <ul className="mt-1.5 space-y-1">
        {messages.map((m) => (
          <li key={m} className="text-[12.5px] leading-relaxed text-ink-muted">
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * §D.10 — sebelumnya panel ini membangun shell-nya sendiri (backdrop,
 * slide-in, header, tombol tutup, Esc-to-close) terpisah dari
 * GuruDetailDrawer, padahal keduanya sama-sama "Context Drawer" (Bagian
 * 71-72, doc 3 — LOCKED pattern: satu pola dipakai untuk SEMUA perubahan
 * sedang, bukan komponen sendiri-sendiri per halaman). Sekarang pakai
 * ulang <Drawer> yang sama dengan Detail Guru — cuma isinya (children)
 * yang beda, shell/animasi/perilaku Esc semuanya satu sumber kebenaran.
 */
export function SlotEditor({
  academicYearId,
  slot,
  entries,
  progress,
  rooms,
  moveTargets,
  onClose,
}: SlotEditorProps) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignScheduleAction,
    initial,
  );
  const [moveState, moveAction, movePending] = useActionState(
    moveScheduleEntryAction,
    initial,
  );
  const [movingId, setMovingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Kelas yang sudah terisi di jam ini ditandai tidak bisa dipilih —
  // mencegah operator memilih sesuatu yang pasti ditolak conflict engine.
  const takenClassNames = useMemo(
    () => new Set(entries.map((e) => e.className)),
    [entries],
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return progress
      .filter((p) =>
        q.length === 0
          ? // Tanpa kata kunci, yang sudah lengkap disembunyikan supaya
            // daftar tetap pendek dan fokus ke yang masih kurang.
            p.status !== "lengkap"
          : `${p.subjectName} ${p.className} ${p.teacherName}`
              .toLowerCase()
              .includes(q),
      )
      .sort((a, b) => b.remainingJp - a.remainingJp);
  }, [progress, query]);

  return (
    <Drawer title={`${DAY_LABEL[slot.day as Day]} — Jam ke-${slot.periodNumber}`} onClose={onClose}>
      <p className="-mt-3 mb-5 text-[12px] text-ink-muted">
        {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
      </p>

      <div className="space-y-5">
        {/* --- Isi slot saat ini --- */}
        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Terisi ({entries.length})
          </p>
          {entries.length === 0 && (
            <p className="rounded-xl border border-dashed border-hairline-strong px-3 py-4 text-center text-[12.5px] text-ink-muted">
              Jam ini masih kosong.
            </p>
          )}
          <div className="space-y-2">
            {entries.map((e) => {
              const color = getIdentityColor(e.subjectColorKey);
              return (
                <div
                  key={e.id}
                  className="overflow-hidden rounded-xl border border-hairline bg-surface"
                >
                  <div className="flex items-start gap-2.5 px-3 py-2.5">
                    <span
                      aria-hidden
                      className="mt-1 h-8 w-[3px] shrink-0 rounded-full"
                      style={{ backgroundColor: color?.accent ?? "#888" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {e.subjectName}
                      </p>
                      <p className="truncate text-[11.5px] text-ink-muted">
                        {e.className} · {e.teacherName}
                        {e.roomName ? ` · ${e.roomName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() =>
                          setMovingId(movingId === e.id ? null : e.id)
                        }
                        aria-label={`Pindah jam ${e.subjectName}`}
                        title="Pindah ke jam lain"
                        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-focus hover:text-ink"
                      >
                        <ArrowRightLeft size={14} strokeWidth={1.75} />
                      </button>
                      <form action={removeScheduleEntryAction}>
                        <input type="hidden" name="entryId" value={e.id} />
                        <input
                          type="hidden"
                          name="academicYearId"
                          value={academicYearId}
                        />
                        <button
                          type="submit"
                          aria-label={`Keluarkan ${e.subjectName}`}
                          title="Keluarkan dari jam ini"
                          className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-status-blocked/10 hover:text-status-blocked"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </form>
                    </div>
                  </div>

                  {movingId === e.id && (
                    <form
                      action={moveAction}
                      className="border-t border-hairline bg-surface-elevated px-3 py-2.5"
                    >
                      <input type="hidden" name="entryId" value={e.id} />
                      <input
                        type="hidden"
                        name="academicYearId"
                        value={academicYearId}
                      />
                      <label className="mb-1.5 block text-[11px] text-ink-muted">
                        Pindah ke jam
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="targetSlotId"
                          defaultValue=""
                          className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent-teal"
                        >
                          <option value="" disabled>
                            Pilih jam tujuan…
                          </option>
                          {moveTargets.map((t) => (
                            <option key={t.id} value={t.id}>
                              {DAY_LABEL[t.day as Day]} — jam ke-
                              {t.periodNumber} ({t.startTime.slice(0, 5)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={movePending}
                          className="shrink-0 rounded-lg bg-accent-teal px-3 py-1.5 text-[12px] font-medium text-accent-teal-ink disabled:opacity-60"
                        >
                          {movePending ? "…" : "Pindah"}
                        </button>
                      </div>
                      {moveState.conflicts && (
                        <div className="mt-2">
                          <ConflictNotice messages={moveState.conflicts} />
                        </div>
                      )}
                      {moveState.error && (
                        <p className="mt-2 text-[12px] text-status-blocked">
                          {moveState.error}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* --- Tambah pelajaran ke slot ini --- */}
        {slot.type === "mengajar" && (
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Tambah pelajaran
            </p>

            {progress.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline-strong px-3 py-4 text-center text-[12.5px] text-ink-muted">
                Belum ada Beban Mengajar. Buat dulu di menu Beban Mengajar.
              </p>
            ) : (
              <form action={assignAction} className="space-y-2.5">
                <input
                  type="hidden"
                  name="academicYearId"
                  value={academicYearId}
                />
                <input type="hidden" name="timeSlotId" value={slot.id} />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari mapel / kelas / guru…"
                  aria-label="Cari beban mengajar"
                  className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
                />

                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-hairline bg-surface p-1">
                  {options.length === 0 && (
                    <p className="px-2 py-3 text-center text-[12px] text-ink-muted">
                      Semua target JP sudah terpenuhi. Ketik untuk mencari
                      yang sudah lengkap.
                    </p>
                  )}
                  {options.map((p) => {
                    const color = getIdentityColor(p.subjectColorKey);
                    const disabled = takenClassNames.has(p.className);
                    return (
                      <label
                        key={p.teachingAssignmentId}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors has-checked:bg-surface-focus ${
                          disabled ? "cursor-not-allowed opacity-40" : "hover:bg-surface-elevated"
                        }`}
                      >
                        <input
                          type="radio"
                          name="teachingAssignmentId"
                          value={p.teachingAssignmentId}
                          disabled={disabled}
                          required
                          className="accent-accent-teal"
                        />
                        <span
                          aria-hidden
                          className="h-5 w-[3px] shrink-0 rounded-full"
                          style={{ backgroundColor: color?.accent ?? "#888" }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] text-ink">
                            {p.subjectName} — {p.className}
                          </span>
                          <span className="block truncate text-[11px] text-ink-muted">
                            {p.teacherName}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-[11px] ${
                            p.remainingJp > 0
                              ? "text-status-incomplete"
                              : "text-status-ready"
                          }`}
                        >
                          {p.scheduledJp}/{p.targetJp} JP
                        </span>
                      </label>
                    );
                  })}
                </div>

                {rooms.length > 0 && (
                  <select
                    name="roomId"
                    defaultValue=""
                    aria-label="Ruang (opsional)"
                    className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-accent-teal"
                  >
                    <option value="">Tanpa ruang khusus</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}

                {assignState.conflicts && (
                  <ConflictNotice messages={assignState.conflicts} />
                )}
                {assignState.error && (
                  <p className="text-[12.5px] text-status-blocked">
                    {assignState.error}
                  </p>
                )}
                {assignState.success && (
                  <p className="text-[12.5px] text-status-ready">
                    ✓ {assignState.success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={assignPending}
                  className="w-full rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink transition-opacity disabled:opacity-60"
                >
                  {assignPending ? "Menyimpan…" : "Masukkan ke jam ini"}
                </button>
              </form>
            )}
          </section>
        )}

        {slot.type !== "mengajar" && (
          <p className="rounded-xl border border-hairline bg-surface-elevated px-3 py-3 text-[12.5px] text-ink-muted">
            Jam ini bertipe{" "}
            <span className="text-ink">
              {slot.type === "istirahat"
                ? "Istirahat"
                : slot.type === "kegiatan"
                  ? slot.activityLabel || "Kegiatan"
                  : "Non-Aktif"}
            </span>
            , jadi tidak bisa diisi pelajaran. Ubah tipenya di Struktur Waktu
            kalau memang ingin dipakai mengajar.
          </p>
        )}
      </div>
    </Drawer>
  );
}
