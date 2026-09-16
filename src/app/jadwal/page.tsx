import Link from "next/link";
import { Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTimeStructureForYear } from "@/lib/data-access/time-structure";
import { listTeachers } from "@/lib/data-access/teacher";
import { listClassesForYear } from "@/lib/data-access/class";
import { listRooms } from "@/lib/data-access/room";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScheduleCanvas } from "@/components/schedule/ScheduleCanvas";
import { PerspectiveTabs } from "@/components/schedule/PerspectiveTabs";
import { EntitySelect } from "@/components/schedule/EntitySelect";

type View = "sekolah" | "kelas" | "guru" | "ruang";

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; entity?: string }>;
}) {
  const { view: rawView, entity } = await searchParams;
  const view: View = (["kelas", "guru", "ruang"].includes(rawView ?? "")
    ? rawView
    : "sekolah") as View;

  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Aktifkan tahun ajaran terlebih dahulu di Beranda.
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

  const timeSlots = await listTimeStructureForYear(supabase, academicYear.id);

  if (timeSlots.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-[18px] font-semibold text-ink">Jadwal</h1>
        <p className="text-[13.5px] text-ink-muted">
          Struktur waktu belum diatur — kanvas jadwal butuh ini sebagai
          fondasi sebelum bisa ditampilkan.
        </p>
        <Link
          href="/jadwal/struktur-waktu"
          className="mt-2 rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink"
        >
          Atur Struktur Waktu
        </Link>
      </div>
    );
  }

  let entityOptions: { id: string; name: string }[] = [];
  let contextLabel = "Sekolah";

  if (view === "kelas") {
    const classes = await listClassesForYear(supabase, academicYear.id);
    entityOptions = classes
      .filter((c) => c.status === "active")
      .map((c) => ({ id: c.id, name: c.name }));
  } else if (view === "guru") {
    const teachers = await listTeachers(supabase);
    entityOptions = teachers
      .filter((t) => t.status === "active")
      .map((t) => ({ id: t.id, name: t.name }));
  } else if (view === "ruang") {
    const rooms = await listRooms(supabase);
    entityOptions = rooms
      .filter((r) => r.status === "active")
      .map((r) => ({ id: r.id, name: r.name }));
  }

  const selectedId = entity ?? entityOptions[0]?.id;
  const selectedName = entityOptions.find((o) => o.id === selectedId)?.name;
  if (view !== "sekolah") {
    contextLabel = selectedName
      ? selectedName
      : `Belum ada ${view === "kelas" ? "kelas" : view === "guru" ? "guru" : "ruang"} aktif`;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        kicker="JADWAL"
        title={contextLabel}
        description={`Tahun ajaran ${academicYear.label} — struktur kanvas mingguan. Isi jadwal menyusul begitu Scheduling Engine dibangun.`}
        action={
          <Link
            href="/jadwal/struktur-waktu"
            className="flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12.5px] text-ink-muted hover:text-ink"
          >
            <Settings2 size={14} strokeWidth={1.75} />
            Pengaturan Jadwal
          </Link>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <PerspectiveTabs active={view} />
        {view !== "sekolah" && entityOptions.length > 0 && (
          <EntitySelect view={view} options={entityOptions} selectedId={selectedId} />
        )}
      </div>

      <div className="mt-5">
        <ScheduleCanvas timeSlots={timeSlots} />
      </div>
    </div>
  );
}
