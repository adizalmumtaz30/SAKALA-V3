import type { TimeSlot } from "@/lib/domain/time-structure";
import { DAYS, DAY_LABEL } from "@/lib/domain/time-structure";

function formatTime(t: string) {
  return t.slice(0, 5);
}

const KEGIATAN_STYLE =
  "border-status-attention/25 bg-status-attention/[0.06] text-status-attention";
const ISTIRAHAT_STYLE = "border-hairline bg-surface-elevated text-ink-faint";
const NONAKTIF_STYLE = "border-hairline bg-transparent text-ink-faint/60";

export function ScheduleCanvas({ timeSlots }: { timeSlots: TimeSlot[] }) {
  const activeSlots = timeSlots.filter((s) => s.status === "active");
  const activeDays = DAYS.filter((d) => activeSlots.some((s) => s.day === d));
  const periodNumbers = Array.from(
    new Set(activeSlots.map((s) => s.periodNumber)),
  ).sort((a, b) => a - b);

  const cell = (day: (typeof DAYS)[number], period: number) =>
    activeSlots.find((s) => s.day === day && s.periodNumber === period) ?? null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="w-16 px-3 py-2.5 text-[11px] font-medium text-ink-faint">
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
            <tr key={period} className="border-b border-hairline last:border-b-0">
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

                if (slot.type === "mengajar") {
                  return (
                    <td key={day} className="border-l border-hairline px-2 py-2 align-top">
                      <div className="rounded-lg border border-dashed border-hairline-strong px-2.5 py-2">
                        <p className="text-[10.5px] text-ink-faint">
                          {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-faint">Kosong</p>
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
                  <td key={day} className="border-l border-hairline px-2 py-2 align-top">
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
  );
}
