import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listClassesForYear } from "@/lib/data-access/class";
import { toggleClassStatusAction } from "@/lib/application/master-data.actions";
import { CreateClassForm } from "@/components/master-data/CreateClassForm";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

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

  const classes = await listClassesForYear(supabase, academicYear.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[20px] font-semibold text-ink">Kelas</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Tahun ajaran {academicYear.label}
      </p>

      <div className="mt-6">
        <CreateClassForm academicYearId={academicYear.id} />
      </div>

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {classes.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            Belum ada data kelas untuk tahun ajaran ini.
          </p>
        )}
        {classes.map((schoolClass) => (
          <div
            key={schoolClass.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-[13.5px] text-ink">{schoolClass.name}</p>
              <StatusBadge status={schoolClass.status} />
            </div>
            <ToggleStatusButton
              id={schoolClass.id}
              status={schoolClass.status}
              action={toggleClassStatusAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
