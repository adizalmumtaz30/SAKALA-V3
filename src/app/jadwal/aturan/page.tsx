import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { updateSchedulingRulesAction } from "@/lib/application/master-data.actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { SchedulingRulesForm } from "@/components/schedule/SchedulingRulesForm";

export default async function AturanJadwalPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Aturan jadwal terikat pada tahun ajaran. Aktifkan tahun ajaran
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        kicker="PENGATURAN JADWAL"
        title="Aturan"
        description={`Tahun ajaran ${academicYear.label} — aturan ini ditegakkan otomatis saat pelajaran ditempatkan di Kanvas Jadwal.`}
      />

      <div className="mt-6 max-w-xl rounded-2xl border border-hairline bg-surface p-5">
        <SchedulingRulesForm
          academicYearId={academicYear.id}
          currentMax={academicYear.maxConsecutiveJp}
          action={updateSchedulingRulesAction}
        />
      </div>
    </div>
  );
}
