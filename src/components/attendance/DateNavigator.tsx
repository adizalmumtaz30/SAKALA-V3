"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function shiftDate(date: string, days: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DateNavigator({ date }: { date: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface p-1">
      <button
        onClick={() => router.push(`/absensi?date=${shiftDate(date, -1)}`)}
        className="rounded-md p-1.5 text-ink-muted hover:text-ink"
        aria-label="Hari sebelumnya"
      >
        <ChevronLeft size={15} strokeWidth={1.75} />
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => router.push(`/absensi?date=${e.target.value}`)}
        className="bg-transparent px-1 text-[12.5px] text-ink outline-none"
      />
      <button
        onClick={() => router.push(`/absensi?date=${shiftDate(date, 1)}`)}
        className="rounded-md p-1.5 text-ink-muted hover:text-ink"
        aria-label="Hari berikutnya"
      >
        <ChevronRight size={15} strokeWidth={1.75} />
      </button>
    </div>
  );
}
