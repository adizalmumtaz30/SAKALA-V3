import { createClient } from "@/lib/supabase/server";
import { listTeachers } from "@/lib/data-access/teacher";
import { createTeacherAction, toggleTeacherStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function GuruPage() {
  const supabase = await createClient();
  const teachers = await listTeachers(supabase);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[20px] font-semibold text-ink">Guru</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Cukup nama untuk mulai — detail lain bisa dilengkapi belakangan.
      </p>

      <div className="mt-6">
        <NameOnlyCreateForm
          action={createTeacherAction}
          placeholder="Nama guru"
          submitLabel="Tambah Guru"
        />
      </div>

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {teachers.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            Belum ada data guru.
          </p>
        )}
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-[13.5px] text-ink">{teacher.name}</p>
              <StatusBadge status={teacher.status} />
            </div>
            <ToggleStatusButton
              id={teacher.id}
              status={teacher.status}
              action={toggleTeacherStatusAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
