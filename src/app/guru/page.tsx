import { IconGuru } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { listTeachers } from "@/lib/data-access/teacher";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listAttendanceForTeacher } from "@/lib/data-access/attendance";
import { listHistoryForEntity } from "@/lib/data-access/history";
import { computeDeactivationWarnings } from "@/lib/application/diagnostics";
import { createTeacherAction, toggleTeacherStatusAction, updateTeacherAction, bulkSetTeacherStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GuruDetailDrawer } from "@/components/master-data/GuruDetailDrawer";
import { SelectableEntityGrid } from "@/components/master-data/SelectableEntityGrid";

export default async function GuruPage({
  searchParams,
}: {
  searchParams: Promise<{ detail?: string }>;
}) {
  const { detail } = await searchParams;
  const supabase = await createClient();
  const academicYearForDeps = await getWorkspaceAcademicYear(supabase);
  const [teachers, allAssignments] = await Promise.all([
    listTeachers(supabase),
    academicYearForDeps
      ? listTeachingAssignmentsForYear(supabase, academicYearForDeps.id)
      : Promise.resolve([]),
  ]);
  const { byTeacher } = computeDeactivationWarnings(allAssignments);

  const selectedTeacher = detail ? teachers.find((t) => t.id === detail) : undefined;
  let selectedAssignments: Awaited<ReturnType<typeof listTeachingAssignmentsForYear>> = [];
  let selectedAttendance: Awaited<ReturnType<typeof listAttendanceForTeacher>> = [];
  let selectedHistory: Awaited<ReturnType<typeof listHistoryForEntity>> = [];
  if (selectedTeacher) {
    const academicYear = await getWorkspaceAcademicYear(supabase);
    if (academicYear) {
      const [all, attendance, history] = await Promise.all([
        listTeachingAssignmentsForYear(supabase, academicYear.id),
        listAttendanceForTeacher(supabase, academicYear.id, selectedTeacher.id, 5),
        listHistoryForEntity(supabase, "guru", selectedTeacher.id, 5),
      ]);
      selectedAssignments = all.filter((a) => a.teacherId === selectedTeacher.id);
      selectedAttendance = attendance;
      selectedHistory = history;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        kicker="DATA"
        title="Guru"
        description="Cukup nama untuk mulai — detail lain bisa dilengkapi belakangan."
      />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        <NameOnlyCreateForm
          action={createTeacherAction}
          placeholder="Nama guru"
          submitLabel="Tambah Guru"
        />
      </div>

      <div className="mt-8">
        {teachers.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface"><EmptyState
            icon={<IconGuru size={16} strokeWidth={1.75} />}
            message="Belum ada data guru."
          /></div>
        ) : (
          <SelectableEntityGrid
            items={teachers}
            bulkActivate={(ids) => bulkSetTeacherStatusAction(ids, "active")}
            bulkDeactivate={(ids) => bulkSetTeacherStatusAction(ids, "inactive")}
            renderRow={(teacher, selectable) => (
              <EntityRow
                key={teacher.id}
                icon={<IconGuru size={15} strokeWidth={1.75} />}
                name={teacher.name}
                status={teacher.status}
                id={teacher.id}
                toggleAction={toggleTeacherStatusAction}
                dependencyWarnings={byTeacher.get(teacher.id)}
                detailHref={`/guru?detail=${teacher.id}`}
                viewScheduleHref={`/jadwal?view=guru&entity=${teacher.id}`}
                addScheduleHref={`/jadwal?view=guru&entity=${teacher.id}`}
                renameAction={updateTeacherAction}
                selectable={selectable}
              />
            )}
          />
        )}
      </div>

      {selectedTeacher && (
        <GuruDetailDrawer
          teacher={selectedTeacher}
          assignments={selectedAssignments}
          attendance={selectedAttendance}
          history={selectedHistory}
        />
      )}
    </div>
  );
}
