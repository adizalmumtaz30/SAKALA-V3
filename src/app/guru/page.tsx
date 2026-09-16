import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listTeachers } from "@/lib/data-access/teacher";
import { createTeacherAction, toggleTeacherStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function GuruPage() {
  const supabase = await createClient();
  const teachers = await listTeachers(supabase);

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
          />
        ))}
      </div>
    </div>
  );
}
