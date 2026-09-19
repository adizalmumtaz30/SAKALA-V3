import Link from "next/link";
import { IconKelas } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listClassesForYear } from "@/lib/data-access/class";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { computeDeactivationWarnings } from "@/lib/application/diagnostics";
import { toggleClassStatusAction, updateClassAction, bulkActivateClassAction, bulkDeactivateClassAction } from "@/lib/application/master-data.actions";
import { CreateClassForm } from "@/components/master-data/CreateClassForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { SelectableEntityGrid } from "@/components/master-data/SelectableEntityGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function KelasPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Kelas selalu terikat pada tahun ajaran. Aktifkan tahun ajaran
          terlebih dahulu di Beranda.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink"
        >
          Ke Beranda
        </Link>
      </div>
    );
  }

  const [classes, assignments] = await Promise.all([
    listClassesForYear(supabase, academicYear.id),
    listTeachingAssignmentsForYear(supabase, academicYear.id),
  ]);
  const { byClass } = computeDeactivationWarnings(assignments);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        kicker="DATA"
        title="Kelas"
        description={`Tahun ajaran ${academicYear.label}`}
      />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        <CreateClassForm academicYearId={academicYear.id} />
      </div>

      <div className="mt-8">
        {classes.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface"><EmptyState
            icon={<IconKelas size={16} strokeWidth={1.75} />}
            message="Belum ada data kelas untuk tahun ajaran ini."
          /></div>
        ) : (
          <SelectableEntityGrid
            bulkActivate={bulkActivateClassAction}
            bulkDeactivate={bulkDeactivateClassAction}
          >
            {classes.map((schoolClass) => (
              <EntityRow
                key={schoolClass.id}
                icon={<IconKelas size={15} strokeWidth={1.75} />}
                name={schoolClass.name}
                meta={schoolClass.capacity ? `${schoolClass.capacity} siswa` : undefined}
                status={schoolClass.status}
                id={schoolClass.id}
                toggleAction={toggleClassStatusAction}
                dependencyWarnings={byClass.get(schoolClass.id)}
                viewScheduleHref={`/jadwal?view=kelas&entity=${schoolClass.id}`}
                addScheduleHref={`/jadwal?view=kelas&entity=${schoolClass.id}`}
                renameAction={updateClassAction}
              />
            ))}
          </SelectableEntityGrid>
        )}
      </div>
    </div>
  );
}
