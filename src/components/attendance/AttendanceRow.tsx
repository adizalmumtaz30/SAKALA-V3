"use client";

import { useState } from "react";
import { recordAttendanceAction } from "@/lib/application/attendance.actions";
import { Select } from "@/components/ui/Select";
import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus } from "@/lib/domain/attendance";

const STATUS_OPTIONS = Object.entries(ATTENDANCE_STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

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
  const [status, setStatus] = useState<AttendanceStatus>(current?.status ?? "hadir");

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

      <Select
        name="status"
        value={status}
        onValueChange={(v) => setStatus(v as AttendanceStatus)}
        options={STATUS_OPTIONS}
      />

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
