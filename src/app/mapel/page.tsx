import { IconMapel } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { listSubjects } from "@/lib/data-access/subject";
import { createSubjectAction, toggleSubjectStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MapelPage() {
  const supabase = await createClient();
  const subjects = await listSubjects(supabase);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
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

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {subjects.length === 0 && (
          <EmptyState
            icon={<IconMapel size={16} strokeWidth={1.75} />}
            message="Belum ada data mata pelajaran."
          />
        )}
        {subjects.map((subject) => (
          <EntityRow
            key={subject.id}
            icon={<IconMapel size={15} strokeWidth={1.75} />}
            name={subject.name}
            status={subject.status}
            id={subject.id}
            toggleAction={toggleSubjectStatusAction}
          />
        ))}
      </div>
    </div>
  );
}
