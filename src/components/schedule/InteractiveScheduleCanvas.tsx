"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { TimeSlot, Day } from "@/lib/domain/time-structure";
import { DAYS, DAY_LABEL } from "@/lib/domain/time-structure";
import type { ScheduleEntry, JpProgress } from "@/lib/domain/schedule";
import { getIdentityColor, withAlpha } from "@/lib/domain/identity-color";
import { SlotEditor } from "@/components/schedule/SlotEditor";

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

  // Saat melihat per kelas/guru/mapel/ruang, entri lain diredupkan bukan
  // dibuang — operator tetap sadar jam itu sebenarnya terpakai. Dihitung
  // di sini (klien), bukan diterima sebagai prop function dari server.
  const focusFilter = useMemo(() => {
    if (!focusView || focusView === "sekolah" || !focusEntityId) return undefined;
    if (focusView === "kelas") return (e: ScheduleEntry) => e.classId === focusEntityId;
    if (focusView === "guru") return (e: ScheduleEntry) => e.teacherId === focusEntityId;
    if (focusView === "mapel") return (e: ScheduleEntry) => e.subjectId === focusEntityId;
    return (e: ScheduleEntry) => e.roomId === focusEntityId;
  }, [focusView, focusEntityId]);

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
  // langsung) — kelompokkan pakai kunci komposit itu.
  const entriesBySlot = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const e of entries) {
      const key = `${e.day}__${e.periodNumber}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

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

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
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

                  const slotEntries = entriesBySlot.get(`${day}__${period}`) ?? [];

                  if (slot.type === "mengajar") {
                    return (
                      <td
                        key={day}
                        className="border-l border-hairline px-2 py-2 align-top"
                      >
                        <div className="space-y-1.5">
                          {slotEntries.map((e) => {
                            const color = getIdentityColor(e.subjectColorKey);
                            const dimmed = focusFilter ? !focusFilter(e) : false;
                            return (
                              <button
                                key={e.id}
                                onClick={() => setOpenSlotId(slot.id)}
                                className={`block w-full overflow-hidden rounded-lg border px-2.5 py-1.5 text-left transition-all hover:brightness-105 ${
                                  dimmed ? "opacity-35" : ""
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
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setOpenSlotId(slot.id)}
                            data-print="hide"
                            aria-label={`Isi ${DAY_LABEL[day]} jam ke-${period}`}
                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-hairline-strong px-2.5 py-1.5 text-[11px] text-ink-faint transition-colors hover:border-accent-teal hover:text-accent-teal"
                          >
                            {slotEntries.length === 0 ? (
                              <>
                                <span className="text-[10px]">
                                  {formatTime(slot.startTime)}
                                </span>
                                <Plus size={12} strokeWidth={2} />
                              </>
                            ) : (
                              <Plus size={12} strokeWidth={2} />
                            )}
                          </button>
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
