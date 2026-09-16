"use client";

import { useState } from "react";
import { updateTimeSlotAction } from "@/lib/application/time-structure.actions";
import type { TimeSlot, TimeSlotType } from "@/lib/domain/time-structure";

const TYPE_LABEL: Record<TimeSlotType, string> = {
  mengajar: "Mengajar",
  kegiatan: "Kegiatan",
  istirahat: "Istirahat",
  nonaktif: "Non-Aktif",
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

export function TimeSlotRow({ slot }: { slot: TimeSlot }) {
  const [type, setType] = useState<TimeSlotType>(slot.type);

  return (
    <form
      action={updateTimeSlotAction}
      className="flex flex-wrap items-center gap-3 px-4 py-2.5"
    >
      <input type="hidden" name="id" value={slot.id} />
      <span className="w-14 shrink-0 text-[12.5px] text-ink-faint">
        P{slot.periodNumber}
      </span>
      <span className="w-28 shrink-0 text-[12.5px] text-ink-muted">
        {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
      </span>

      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as TimeSlotType)}
        className="rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent-teal"
      >
        {Object.entries(TYPE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {type === "kegiatan" && (
        <input
          name="activityLabel"
          defaultValue={slot.activityLabel ?? ""}
          placeholder="Contoh: Upacara, Religi"
          className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
        />
      )}

      <button
        type="submit"
        className="ml-auto shrink-0 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
      >
        Simpan
      </button>
    </form>
  );
}
