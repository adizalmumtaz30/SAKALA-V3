import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTimeStructureForYear } from "@/lib/data-access/time-structure";
import { GenerateTimeStructureForm } from "@/components/time-structure/GenerateTimeStructureForm";
import { TimeSlotRow } from "@/components/time-structure/TimeSlotRow";
import { DAYS, DAY_LABEL } from "@/lib/domain/time-structure";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function StrukturWaktuPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Struktur waktu terikat pada tahun ajaran. Aktifkan tahun ajaran
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

  const slots = await listTimeStructureForYear(supabase, academicYear.id);
  const slotsByDay = new Map(DAYS.map((d) => [d, slots.filter((s) => s.day === d)]));
  const activeDays = DAYS.filter((d) => (slotsByDay.get(d)?.length ?? 0) > 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        kicker="JADWAL · PENGATURAN JADWAL"
        title="Struktur Waktu"
        description={`Tahun ajaran ${academicYear.label} — fondasi slot waktu yang dibaca Scheduling Engine sebelum menyusun jadwal.`}
      />

      {slots.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
          <GenerateTimeStructureForm academicYearId={academicYear.id} />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {activeDays.map((day) => (
            <div
              key={day}
              className="overflow-hidden rounded-2xl border border-hairline bg-surface"
            >
              <div className="border-b border-hairline px-4 py-2.5">
                <h2 className="text-[13px] font-medium text-ink">
                  {DAY_LABEL[day]}
                </h2>
              </div>
              <div className="divide-y divide-hairline">
                {slotsByDay.get(day)!.map((slot) => (
                  <TimeSlotRow key={slot.id} slot={slot} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
