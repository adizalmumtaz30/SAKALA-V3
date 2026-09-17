import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listTeachers } from "@/lib/data-access/teacher";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listAttendanceForTeacher } from "@/lib/data-access/attendance";
import { listHistoryForEntity } from "@/lib/data-access/history";
import { createTeacherAction, toggleTeacherStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GuruDetailDrawer } from "@/components/master-data/GuruDetailDrawer";

export default async function GuruPage({
  searchParams,
}: {
  searchParams: Promise<{ detail?: string }>;
}) {
  const { detail } = await searchParams;
  const supabase = await createClient();
  const teachers = await listTeachers(supabase);

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
    <div className="mx-auto max-w-2xl px-6 py-10">
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

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {teachers.length === 0 && (
          <EmptyState
            icon={<Users size={16} strokeWidth={1.75} />}
            message="Belum ada data guru."
          />
        )}
        {teachers.map((teacher) => (
          <EntityRow
            key={teacher.id}
            icon={<Users size={15} strokeWidth={1.75} />}
            name={teacher.name}
            status={teacher.status}
            id={teacher.id}
            toggleAction={toggleTeacherStatusAction}
            detailHref={`/guru?detail=${teacher.id}`}
          />
        ))}
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
