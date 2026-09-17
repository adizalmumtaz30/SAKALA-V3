"use client";

import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { toggleTeacherStatusAction } from "@/lib/application/master-data.actions";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/domain/attendance";
import type { Teacher } from "@/lib/domain/teacher";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { AttendanceRecord } from "@/lib/domain/attendance";
import type { HistoryEntry } from "@/lib/domain/history";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuruDetailDrawer({
  teacher,
  assignments,
  attendance,
  history,
}: {
  teacher: Teacher;
  assignments: TeachingAssignment[];
  attendance: AttendanceRecord[];
  history: HistoryEntry[];
}) {
  const router = useRouter();
  const totalJp = assignments
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.targetJp, 0);

  return (
    <Drawer title={teacher.name} onClose={() => router.push("/guru")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <StatusBadge status={teacher.status} />
          <ToggleStatusButton
            id={teacher.id}
            status={teacher.status}
            action={toggleTeacherStatusAction}
          />
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-wide text-ink-faint">
            BEBAN MENGAJAR
          </p>
          {assignments.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">
              Belum ada beban mengajar.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2"
                >
                  <span className="text-[12.5px] text-ink">
                    {a.subjectName} — {a.className}
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    {a.targetJp} JP
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 text-[12.5px]">
                <span className="text-ink-muted">Total</span>
                <span className="text-ink">{totalJp} JP/minggu</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wide text-ink-faint">
              ABSENSI TERBARU
            </p>
            <a
              href={`/absensi?date=${attendance[0]?.date ?? ""}`}
              className="text-[11px] text-accent-teal hover:underline"
            >
              Lihat Absensi
            </a>
          </div>
          {attendance.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">
              Belum ada catatan absensi.
            </p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {attendance.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-[12.5px]"
                >
                  <span className="text-ink-muted">{formatDate(a.date)}</span>
                  <span className="text-ink">
                    {ATTENDANCE_STATUS_LABEL[a.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-wide text-ink-faint">
            RIWAYAT
          </p>
          {history.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">
              Belum ada riwayat perubahan.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {history.map((h) => (
                <div key={h.id}>
                  <p className="text-[12.5px] text-ink">{h.summary}</p>
                  <p className="text-[11px] text-ink-faint">
                    {formatDateTime(h.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
