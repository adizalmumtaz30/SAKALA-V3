"use client";

import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { toggleTeacherStatusAction } from "@/lib/application/master-data.actions";
import type { Teacher } from "@/lib/domain/teacher";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";

export function GuruDetailDrawer({
  teacher,
  assignments,
}: {
  teacher: Teacher;
  assignments: TeachingAssignment[];
}) {
  const router = useRouter();
  const totalJp = assignments
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.targetJp, 0);

  return (
    <Drawer title={teacher.name} onClose={() => router.push("/guru")}>
      <div className="space-y-5">
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
      </div>
    </Drawer>
  );
}
