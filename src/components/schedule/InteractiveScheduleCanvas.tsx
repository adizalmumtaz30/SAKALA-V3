"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { TimeSlot, Day } from "@/lib/domain/time-structure";
import { DAYS, DAY_LABEL } from "@/lib/domain/time-structure";
import type { ScheduleEntry, JpProgress } from "@/lib/domain/schedule";
import { getIdentityColor, withAlpha } from "@/lib/domain/identity-color";
import { SlotEditor } from "@/components/schedule/SlotEditor";
import { moveScheduleEntryAction } from "@/lib/application/schedule.actions";
import { useToast } from "@/components/ui/Toast";

function formatTime(t: string) {
  return t.slice(0, 5);
}

const KEGIATAN_STYLE =
  "border-status-attention/25 bg-status-attention/[0.06] text-status-attention";
const ISTIRAHAT_STYLE = "border-hairline bg-surface-elevated text-ink-faint";
const NONAKTIF_STYLE = "border-hairline bg-transparent text-ink-faint/60";

interface Props {
  academicYearId: string;
  timeSlots: TimeSlot[];
  entries: ScheduleEntry[];
  progress: JpProgress[];
  rooms: { id: string; name: string }[];
  /** §Bugfix runtime — sebelumnya `focusFilter` (function) dihitung di
   *  Server Component (/jadwal) lalu dilempar ke sini. Next.js melarang
   *  closure lintas batas Server->Client (cuma Server Action yang boleh),
   *  errornya baru muncul di RUNTIME. Diganti dua nilai serializable
   *  (string/null) — logika pencocokan dipindah ke sini, di sisi klien. */
  focusView?: "sekolah" | "kelas" | "guru" | "mapel" | "ruang";
  focusEntityId?: string | null;
}

export function InteractiveScheduleCanvas({
  academicYearId,
  timeSlots,
  entries,
  progress,
  rooms,
  focusView,
  focusEntityId,
}: Props) {
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);

  // §Segmentasi murni — sebelumnya entri di luar pilihan cuma diredupkan
  // (tetap tampil, opacity turun). Diubah atas permintaan eksplisit
  // pemilik produk: saat Kelas/Guru/Mapel/Ruang dipilih, entri lain TIDAK
  // ditampilkan sama sekali, bukan cuma pudar — grid dan cetak (yang
  // membaca DOM yang sama) otomatis ikut tersegmentasi karena filter ini
  // diterapkan di sumber datanya (visibleEntries), bukan di gaya tampilan.
  const visibleEntries = useMemo(() => {
    if (!focusView || focusView === "sekolah" || !focusEntityId) return entries;
    const matches = (e: ScheduleEntry) => {
      if (focusView === "kelas") return e.classId === focusEntityId;
      if (focusView === "guru") return e.teacherId === focusEntityId;
      if (focusView === "mapel") return e.subjectId === focusEntityId;
      return e.roomId === focusEntityId;
    };
    return entries.filter(matches);
  }, [entries, focusView, focusEntityId]);

  // §Item 3 — "digeser bukan tombol": memindah pelajaran yang sudah ada
  // sekarang utamanya lewat drag (native HTML5 DnD, tanpa pustaka
  // tambahan). Tombol "Pindah" di panel (SlotEditor) TETAP ada di
  // belakangnya — operator yang tidak bisa/tidak mau drag (keyboard,
  // pembaca layar, mouse tidak presisi) masih punya jalan.
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { show: showToast } = useToast();

  const activeSlots = useMemo(
    () => timeSlots.filter((s) => s.status === "active"),
    [timeSlots],
  );
  const activeDays = useMemo(
    () => DAYS.filter((d) => activeSlots.some((s) => s.day === d)),
    [activeSlots],
  );
  const periodNumbers = useMemo(
    () =>
      Array.from(new Set(activeSlots.map((s) => s.periodNumber))).sort(
        (a, b) => a - b,
      ),
    [activeSlots],
  );

  // Entri tidak lagi punya timeSlotId (skema live menyimpan day+period_number
  // langsung) — kelompokkan pakai kunci komposit itu. Dibangun dari
  // visibleEntries (sudah tersegmentasi), bukan entries mentah.
  const entriesBySlot = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const e of visibleEntries) {
      const key = `${e.day}__${e.periodNumber}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [visibleEntries]);

  const teachingSlots = useMemo(
    () =>
      activeSlots
        .filter((s) => s.type === "mengajar")
        .sort(
          (a, b) =>
            DAYS.indexOf(a.day as Day) - DAYS.indexOf(b.day as Day) ||
            a.periodNumber - b.periodNumber,
        ),
    [activeSlots],
  );

  const openSlot = activeSlots.find((s) => s.id === openSlotId) ?? null;

  const cell = (day: Day, period: number) =>
    activeSlots.find((s) => s.day === day && s.periodNumber === period) ?? null;

  function handleDrop(day: Day, periodNumber: number, entry: ScheduleEntry) {
    setDragOverSlotKey(null);
    setDraggingEntryId(null);
    if (entry.day === day && entry.periodNumber === periodNumber) return; // dijatuhkan di tempat sendiri

    const targetSlot = teachingSlots.find(
      (s) => s.day === day && s.periodNumber === periodNumber,
    );
    if (!targetSlot) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("entryId", entry.id);
      formData.set("academicYearId", academicYearId);
      formData.set("targetSlotId", targetSlot.id);

      const result = await moveScheduleEntryAction({}, formData);
      if (result.conflicts) {
        showToast({ message: result.conflicts[0], tone: "danger" });
      } else if (result.error) {
        showToast({ message: result.error, tone: "danger" });
      } else if (result.success) {
        showToast({ message: result.success, tone: "success" });
      }
    });
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {activeDays.map((day) => (
          <section key={day} className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <div className="border-b border-hairline bg-surface-elevated px-4 py-3">
              <h2 className="text-[13px] font-semibold text-ink">{DAY_LABEL[day]}</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-faint">Jadwal harian</p>
            </div>
            <div className="divide-y divide-hairline">
              {periodNumbers.map((period) => {
                const slot = cell(day, period);
                if (!slot) return null;
                const slotKey = `${day}__${period}`;
                const slotEntries = entriesBySlot.get(slotKey) ?? [];
                const slotStyle = slot.type === "kegiatan" ? KEGIATAN_STYLE : slot.type === "istirahat" ? ISTIRAHAT_STYLE : NONAKTIF_STYLE;
                return (
                  <div key={period} className="px-3 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-ink-faint">Jam ke-{period}</span>
                      <span className="text-[10.5px] text-ink-faint">{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</span>
                    </div>
                    {slot.type === "mengajar" ? (
                      slotEntries.length > 0 ? (
                        <div className="space-y-2">
                          {slotEntries.map((e) => {
                            const color = getIdentityColor(e.subjectColorKey);
                            return (
                              <button key={e.id} type="button" onClick={() => setOpenSlotId(slot.id)}
                                className="block w-full rounded-xl border px-3 py-2.5 text-left"
                                style={{ borderColor: color?.accent ?? undefined, backgroundColor: color ? withAlpha(color.tintDark, 0.26) : undefined, borderLeftWidth: 5 }}>
                                <p className="truncate text-[13px] font-medium text-ink">{e.subjectName}</p>
                                <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">{e.className} · {e.teacherName}</p>
                                {e.roomName && <p className="mt-0.5 truncate text-[10.5px] text-ink-faint">{e.roomName}</p>}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <button type="button" onClick={() => setOpenSlotId(slot.id)}
                          aria-label={`Isi ${DAY_LABEL[day]} jam ke-${period}`}
                          className="flex min-h-12 w-full items-center justify-between rounded-xl border border-dashed border-hairline-strong px-3 text-[11px] text-ink-faint hover:border-accent-teal hover:text-accent-teal">
                          <span>Slot kosong</span><Plus size={15} strokeWidth={2} />
                        </button>
                      )
                    ) : (
                      <div className={`rounded-xl border px-3 py-2.5 ${slotStyle}`}>
                        <p className="text-[12px]">{slot.type === "kegiatan" ? slot.activityLabel || "Kegiatan" : slot.type === "istirahat" ? "Istirahat" : "Non-Aktif"}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-hairline bg-surface md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th className="w-20 px-3 py-2.5 text-[11px] font-medium text-ink-faint">
                &nbsp;
              </th>
              {activeDays.map((day) => (
                <th
                  key={day}
                  className="border-l border-hairline px-3 py-2.5 text-[12px] font-medium text-ink"
                >
                  {DAY_LABEL[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNumbers.map((period) => (
              <tr
                key={period}
                data-print="keep"
                className="border-b border-hairline last:border-b-0"
              >
                <td className="px-3 py-2 align-top text-[11px] text-ink-faint">
                  Jam ke-{period}
                </td>
                {activeDays.map((day) => {
                  const slot = cell(day, period);
                  if (!slot) {
                    return (
                      <td
                        key={day}
                        className="border-l border-hairline px-2 py-2 align-top"
                      />
                    );
                  }

                  const slotKey = `${day}__${period}`;
                  const slotEntries = entriesBySlot.get(slotKey) ?? [];

                  if (slot.type === "mengajar") {
                    const isDragOver = dragOverSlotKey === slotKey;
                    return (
                      <td
                        key={day}
                        onDragOver={(ev) => {
                          if (!draggingEntryId) return;
                          ev.preventDefault();
                          if (dragOverSlotKey !== slotKey) setDragOverSlotKey(slotKey);
                        }}
                        onDragLeave={() => {
                          if (dragOverSlotKey === slotKey) setDragOverSlotKey(null);
                        }}
                        onDrop={(ev) => {
                          ev.preventDefault();
                          const entry = visibleEntries.find((e) => e.id === draggingEntryId);
                          if (entry) handleDrop(day, period, entry);
                        }}
                        className={`border-l border-hairline px-2 py-2 align-top transition-colors ${
                          isDragOver ? "bg-accent-teal/10" : ""
                        }`}
                      >
                        <div className="space-y-1.5">
                          {slotEntries.map((e) => {
                            const color = getIdentityColor(e.subjectColorKey);
                            const isBeingDragged = draggingEntryId === e.id;
                            return (
                              <div
                                key={e.id}
                                draggable
                                onDragStart={(ev) => {
                                  setDraggingEntryId(e.id);
                                  ev.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => {
                                  setDraggingEntryId(null);
                                  setDragOverSlotKey(null);
                                }}
                                onClick={() => setOpenSlotId(slot.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(ev) => {
                                  if (ev.key === "Enter" || ev.key === " ") setOpenSlotId(slot.id);
                                }}
                                className={`block w-full cursor-grab overflow-hidden rounded-lg border px-2.5 py-1.5 text-left transition-all hover:brightness-105 active:cursor-grabbing ${
                                  isBeingDragged ? "opacity-40" : ""
                                }`}
                                style={{
                                  borderColor: color?.accent ?? undefined,
                                  // §Solusi "warna kurang nampak" — tint dasar
                                  // (tintDark) sengaja sangat lembut untuk
                                  // konteks lain (badge/swatch), tapi di sel
                                  // grid yang padat itu jadi nyaris tak
                                  // terlihat. withAlpha() menurunkan varian
                                  // lebih tegas dari basis rgb YANG SAMA
                                  // (bukan warna baru) — tetap tint, bukan
                                  // fill solid, jadi prinsip readability
                                  // tidak dilanggar.
                                  backgroundColor: color ? withAlpha(color.tintDark, 0.26) : undefined,
                                  borderLeftWidth: 5,
                                }}
                              >
                                <p className="mb-1 text-[10px] text-ink-muted">
                                  {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                                </p>
                                <p className="flex items-center gap-1.5 truncate text-[11.5px] font-medium text-ink">
                                  <span
                                    aria-hidden
                                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: color?.accent ?? undefined }}
                                  />
                                  <span className="truncate">{e.subjectName}</span>
                                </p>
                                <p className="truncate text-[10.5px] text-ink-muted">
                                  {e.className} · {e.teacherName}
                                </p>
                                {e.roomName && (
                                  <p className="truncate text-[10px] text-ink-faint">
                                    {e.roomName}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {slotEntries.length === 0 && (
                            <button
                              onClick={() => setOpenSlotId(slot.id)}
                              aria-label={`Isi ${DAY_LABEL[day]} jam ke-${period}`}
                              className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-hairline-strong px-2.5 py-2 text-[11px] text-ink-faint transition-colors hover:border-accent-teal hover:text-accent-teal"
                            >
                              <Plus size={14} strokeWidth={2} />
                              <span className="text-[10px]">
                                {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  }

                  const style =
                    slot.type === "kegiatan"
                      ? KEGIATAN_STYLE
                      : slot.type === "istirahat"
                        ? ISTIRAHAT_STYLE
                        : NONAKTIF_STYLE;

                  return (
                    <td
                      key={day}
                      className="border-l border-hairline px-2 py-2 align-top"
                    >
                      <div className={`rounded-lg border px-2.5 py-2 ${style}`}>
                        <p className="text-[10.5px] opacity-70">
                          {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                        </p>
                        <p className="mt-0.5 text-[12px]">
                          {slot.type === "kegiatan"
                            ? slot.activityLabel || "Kegiatan"
                            : slot.type === "istirahat"
                              ? "Istirahat"
                              : "Non-Aktif"}
                        </p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openSlot && (
        <SlotEditor
          academicYearId={academicYearId}
          slot={openSlot}
          entries={entriesBySlot.get(`${openSlot.day}__${openSlot.periodNumber}`) ?? []}
          progress={progress}
          rooms={rooms}
          moveTargets={teachingSlots.filter((s) => s.id !== openSlot.id)}
          onClose={() => setOpenSlotId(null)}
        />
      )}
    </>
  );
}
