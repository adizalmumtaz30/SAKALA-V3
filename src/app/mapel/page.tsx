import { createClient } from "@/lib/supabase/server";
import { listSubjects } from "@/lib/data-access/subject";
import { createSubjectAction, toggleSubjectStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function MapelPage() {
  const supabase = await createClient();
  const subjects = await listSubjects(supabase);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[20px] font-semibold text-ink">Mapel</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Daftar mata pelajaran yang diajarkan di sekolah.
      </p>

      <div className="mt-6">
        <NameOnlyCreateForm
          action={createSubjectAction}
          placeholder="Nama mata pelajaran"
          submitLabel="Tambah Mapel"
        />
      </div>

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {subjects.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            Belum ada data mata pelajaran.
          </p>
        )}
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-[13.5px] text-ink">{subject.name}</p>
              <StatusBadge status={subject.status} />
            </div>
            <ToggleStatusButton
              id={subject.id}
              status={subject.status}
              action={toggleSubjectStatusAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
