import { IconMapel } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { listSubjects } from "@/lib/data-access/subject";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { computeDeactivationWarnings } from "@/lib/application/diagnostics";
import { ColorPicker } from "@/components/master-data/ColorPicker";
import { getIdentityColor } from "@/lib/domain/identity-color";
import { createSubjectAction, toggleSubjectStatusAction, updateSubjectAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MapelPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);
  const [subjects, assignments] = await Promise.all([
    listSubjects(supabase),
    academicYear
      ? listTeachingAssignmentsForYear(supabase, academicYear.id)
      : Promise.resolve([]),
  ]);
  const { bySubject } = computeDeactivationWarnings(assignments);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        kicker="DATA"
        title="Mapel"
        description="Daftar mata pelajaran yang diajarkan di sekolah."
      />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        <NameOnlyCreateForm
          action={createSubjectAction}
          placeholder="Nama mata pelajaran"
          submitLabel="Tambah Mapel"
        />
      </div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.length === 0 && (
          <div className="col-span-full rounded-xl border border-hairline bg-surface"><EmptyState
            icon={<IconMapel size={16} strokeWidth={1.75} />}
            message="Belum ada data mata pelajaran."
          /></div>
        )}
        {subjects.map((subject) => (
          <EntityRow
            key={subject.id}
            icon={<IconMapel size={15} strokeWidth={1.75} />}
            name={subject.name}
            status={subject.status}
            id={subject.id}
            toggleAction={toggleSubjectStatusAction}
            dependencyWarnings={bySubject.get(subject.id)}
            accentColor={getIdentityColor(subject.colorKey)?.accent}
            viewScheduleHref={`/jadwal?view=mapel&entity=${subject.id}`}
            renameAction={updateSubjectAction}
            trailing={
              <ColorPicker
                subjectId={subject.id}
                subjectName={subject.name}
                currentKey={subject.colorKey}
                totalSubjects={subjects.length}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
