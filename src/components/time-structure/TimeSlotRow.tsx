"use client";

import { useState, useTransition } from "react";
import {
  updateTimeSlotAction,
  updateSlotDurationAction,
} from "@/lib/application/time-structure.actions";
import { useToast } from "@/components/ui/Toast";
import { Save } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { TimeSlot, TimeSlotType } from "@/lib/domain/time-structure";

const TYPE_LABEL: Record<TimeSlotType, string> = {
  mengajar: "Mengajar",
  kegiatan: "Kegiatan",
  istirahat: "Istirahat",
  nonaktif: "Non-Aktif",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }));

/** Perlakuan visual berbeda per jenis slot (Bagian E.1.5 poin 5). */
const TYPE_ACCENT: Record<TimeSlotType, string> = {
  mengajar: "bg-accent-teal",
  kegiatan: "bg-status-attention",
  istirahat: "bg-ink-faint",
  nonaktif: "bg-transparent",
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

function durationOf(slot: TimeSlot): number {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function TimeSlotRow({ slot }: { slot: TimeSlot }) {
  const [type, setType] = useState<TimeSlotType>(slot.type);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const duration = durationOf(slot);

  function changeDuration(next: number) {
    if (next === duration || next <= 0) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", slot.id);
      formData.set("durationMinutes", String(next));
      await updateSlotDurationAction(formData);
      show({
        message: `Durasi jadi ${next} menit — jam sesudahnya digeser otomatis`,
        tone: "success",
      });
    });
  }

  return (
    <div className="relative flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-elevated">
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-[3px] ${TYPE_ACCENT[type]}`}
      />
      <span className="w-20 shrink-0 text-[12.5px] text-ink-faint">
        Jam ke-{slot.periodNumber}
      </span>
      <span className="w-28 shrink-0 text-[12.5px] tabular-nums text-ink-muted">
        {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
      </span>

      {/* Durasi per slot — bukan satu durasi global (Bagian E.1.5 poin 1-2) */}
      <label className="flex shrink-0 items-center gap-1.5">
        <input
          type="number"
          min={1}
          defaultValue={duration}
          disabled={pending}
          onBlur={(e) => changeDuration(Number(e.target.value))}
          aria-label={`Durasi jam ke-${slot.periodNumber} dalam menit`}
          className="w-16 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-[12.5px] tabular-nums text-ink outline-none focus:border-accent-teal disabled:opacity-50"
        />
        <span className="text-[11.5px] text-ink-faint">menit</span>
      </label>

      <form action={updateTimeSlotAction} className="flex flex-1 items-center gap-3">
        <input type="hidden" name="id" value={slot.id} />

        {/* Select Radix (name="type") -- render native <select> tersembunyi
            sendiri di baliknya utk ikut FormData saat submit, jadi tidak
            perlu <select> bayangan manual. */}
        <Select
          name="type"
          value={type}
          onValueChange={(v) => setType(v as TimeSlotType)}
          options={TYPE_OPTIONS}
        />

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
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-teal px-3.5 py-2 text-[12px] font-semibold text-accent-teal-ink shadow-sm transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={14} strokeWidth={2} />
          Simpan
        </button>
      </form>
    </div>
  );
}
