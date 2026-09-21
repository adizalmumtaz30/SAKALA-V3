import Link from "next/link";
import { Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTimeStructureForYear } from "@/lib/data-access/time-structure";
import { listTeachers } from "@/lib/data-access/teacher";
import { listClassesForYear } from "@/lib/data-access/class";
import { listRooms } from "@/lib/data-access/room";
import { listSubjects } from "@/lib/data-access/subject";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { listScheduleEntriesForYear } from "@/lib/data-access/schedule";
import { computeJpProgress } from "@/lib/application/schedule-conflict";
import { PageHeader } from "@/components/ui/PageHeader";
import { InteractiveScheduleCanvas } from "@/components/schedule/InteractiveScheduleCanvas";
import { JpProgressPanel } from "@/components/schedule/JpProgressPanel";
import { PerspectiveTabs } from "@/components/schedule/PerspectiveTabs";
import { EntitySelect } from "@/components/schedule/EntitySelect";
import { PrintButton } from "@/components/ui/PrintButton";
import { AutoScheduleButton } from "@/components/schedule/AutoScheduleButton";
import { RepairScheduleGapsButton } from "@/components/schedule/RepairScheduleGapsButton";

type View = "kelas" | "guru" | "mapel" | "ruang";

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; entity?: string }>;
}) {
  const { view: rawView, entity } = await searchParams;
  const view: View = (["kelas", "guru", "mapel", "ruang"].includes(rawView ?? "")
    ? rawView
    : "kelas") as View;

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
  } else if (view === "mapel") {
    const subjects = await listSubjects(supabase);
    entityOptions = subjects
      .filter((s) => s.status === "active")
      .map((s) => ({ id: s.id, name: s.name }));
  } else if (view === "ruang") {
    const rooms = await listRooms(supabase);
    entityOptions = rooms
      .filter((r) => r.status === "active")
      .map((r) => ({ id: r.id, name: r.name }));
  }

  // Data Schedule Engine.
  const [assignments, entries, allRooms] = await Promise.all([
    listTeachingAssignmentsForYear(supabase, academicYear.id),
    listScheduleEntriesForYear(supabase, academicYear.id).catch(() => []),
    listRooms(supabase),
  ]);
  const progress = computeJpProgress(assignments, entries);

  // Pemenuhan Target JP mengikuti konteks yang sedang dipilih. Jadi ketika
  // operator memilih satu kelas/guru/mapel, ringkasan dan daftar target hanya
  // menghitung beban mengajar milik konteks tersebut — bukan seluruh sekolah.
  // Untuk perspektif Ruang, target JP tidak punya relasi ruang pada model
  // Beban Mengajar, sehingga ringkasannya tetap memakai seluruh target.
  const selectedId = entity ?? entityOptions[0]?.id;
  const visibleProgress =
    selectedId && view !== "ruang"
      ? progress.filter((p) => {
          if (view === "kelas") return assignments.find(
            (a) => a.id === p.teachingAssignmentId,
          )?.classId === selectedId;
          if (view === "guru") return assignments.find(
            (a) => a.id === p.teachingAssignmentId,
          )?.teacherId === selectedId;
          return assignments.find(
            (a) => a.id === p.teachingAssignmentId,
          )?.subjectId === selectedId;
        })
      : progress;

  const roomOptions = allRooms
    .filter((r) => r.status === "active")
    .map((r) => ({ id: r.id, name: r.name }));


  const selectedName = entityOptions.find((o) => o.id === selectedId)?.name;
  const emptyNoun =
    view === "kelas" ? "kelas" : view === "guru" ? "guru" : view === "mapel" ? "mapel" : "ruang";
  const contextLabel = selectedName ? selectedName : `Belum ada ${emptyNoun} aktif`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader
        kicker="JADWAL"
        title={contextLabel}
        description={`Tahun ajaran ${academicYear.label} — klik tanda + pada jam mana pun untuk memasukkan pelajaran.`}
        action={
          <div className="flex items-center gap-2">
            {/* Segmented ke kelas yang sedang dipilih — cuma tampil di
                perspektif Kelas dengan kelas terpilih (permintaan pemilik
                produk: "berlaku segmented kelas yang sedang dipilih"). */}
            {view === "kelas" && selectedId && selectedName && (
              <AutoScheduleButton
                academicYearId={academicYear.id}
                classId={selectedId}
                className={selectedName}
              />
            )}
            <RepairScheduleGapsButton academicYearId={academicYear.id} />
            <PrintButton label="Cetak Jadwal" />
            <Link
              href="/jadwal/struktur-waktu"
              data-print="hide"
              className="flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12.5px] text-ink-muted hover:text-ink"
            >
              <Settings2 size={14} strokeWidth={1.75} />
              Pengaturan Jadwal
            </Link>
          </div>
        }
      />

      {/* Judul lembar — hanya tercetak, memberi konteks pada kertas yang
          lepas dari aplikasi (Bagian F.7). */}
      <div data-print="title" className="mb-4">
        <p className="text-[17px] font-semibold text-ink">
          Jadwal {contextLabel}
        </p>
        <p className="text-[12px] text-ink-muted">
          Tahun ajaran {academicYear.label}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3" data-print="hide">
        <PerspectiveTabs active={view} />
        {entityOptions.length > 0 && (
          <EntitySelect view={view} options={entityOptions} selectedId={selectedId} />
        )}
      </div>

      <div className="mt-5" data-print="hide">
        <JpProgressPanel progress={visibleProgress} />
      </div>

      <div className="mt-4">
        <InteractiveScheduleCanvas
          academicYearId={academicYear.id}
          timeSlots={timeSlots}
          entries={entries}
          progress={visibleProgress}
          rooms={roomOptions}
          focusView={view}
          focusEntityId={selectedId ?? null}
        />
      </div>
    </div>
  );
}
