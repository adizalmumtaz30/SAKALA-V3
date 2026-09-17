"use client";

import { recordAttendanceAction } from "@/lib/application/attendance.actions";
import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus } from "@/lib/domain/attendance";

export function AttendanceRow({
  academicYearId,
  date,
  teacherId,
  teacherName,
  current,
}: {
  academicYearId: string;
  date: string;
  teacherId: string;
  teacherName: string;
  current: { status: AttendanceStatus; note: string | null } | null;
}) {
  return (
    <form
      action={recordAttendanceAction}
      className="flex flex-wrap items-center gap-3 px-4 py-2.5"
    >
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="date" value={date} />

      <span className="w-40 shrink-0 truncate text-[13px] text-ink">
        {teacherName}
      </span>

      <select
        name="status"
        defaultValue={current?.status ?? "hadir"}
        className="rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent-teal"
      >
        {Object.entries(ATTENDANCE_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <input
        name="note"
        defaultValue={current?.note ?? ""}
        placeholder="Catatan (opsional)"
        className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent-teal"
      />

      <button
        type="submit"
        className="shrink-0 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
      >
        {current ? "Simpan" : "Catat"}
      </button>
    </form>
  );
}
