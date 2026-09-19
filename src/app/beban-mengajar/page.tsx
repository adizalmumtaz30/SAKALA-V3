import Link from "next/link";
import { IconBebanMengajar } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachers } from "@/lib/data-access/teacher";
import { listSubjects } from "@/lib/data-access/subject";
import { listClassesForYear } from "@/lib/data-access/class";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { toggleBebanMengajarStatusAction } from "@/lib/application/teaching-assignment.actions";
import { CreateBebanMengajarForm } from "@/components/master-data/CreateBebanMengajarForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { DuplicateBebanMengajarForm } from "@/components/master-data/DuplicateBebanMengajarForm";
import { Copy } from "lucide-react";
import { getIdentityColor } from "@/lib/domain/identity-color";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteBebanMengajarButton } from "@/components/master-data/DeleteBebanMengajarButton";

export default async function BebanMengajarPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Beban mengajar terikat pada tahun ajaran. Aktifkan tahun ajaran
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

  const [teachers, subjects, classes, assignments] = await Promise.all([
    listTeachers(supabase),
    listSubjects(supabase),
    listClassesForYear(supabase, academicYear.id),
    listTeachingAssignmentsForYear(supabase, academicYear.id),
  ]);

  const activeTeachers = teachers.filter((t) => t.status === "active");
  const activeSubjects = subjects.filter((s) => s.status === "active");
  const activeClasses = classes.filter((c) => c.status === "active");

  const missingData =
    activeTeachers.length === 0 ||
    activeSubjects.length === 0 ||
    activeClasses.length === 0;

  // Kelompokkan per guru — urutan kemunculan pertama di data (bukan
  // di-sort ulang) supaya konsisten dengan urutan yang operator kenal.
  const teacherOrder: string[] = [];
  const byTeacher = new Map<string, typeof assignments>();
  for (const a of assignments) {
    if (!byTeacher.has(a.teacherId)) {
      teacherOrder.push(a.teacherId);
      byTeacher.set(a.teacherId, []);
    }
    byTeacher.get(a.teacherId)!.push(a);
  }
  const teacherGroups = teacherOrder.map((teacherId) => {
    const rows = byTeacher.get(teacherId)!;
    return {
      teacherId,
      teacherName: rows[0].teacherName,
      totalJp: rows.reduce((sum, a) => sum + a.targetJp, 0),
      rows,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader
        kicker="DATA"
        title="Beban Mengajar"
        description={`Tahun ajaran ${academicYear.label} — hubungkan Guru, Mata Pelajaran, dan Kelas beserta target JP mingguan.`}
      />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        {missingData ? (
          <p className="text-[13px] text-status-incomplete">
            Lengkapi dulu data Guru, Mapel, dan Kelas (masing-masing minimal
            1 data aktif) sebelum menambah beban mengajar.
          </p>
        ) : (
          <CreateBebanMengajarForm
            academicYearId={academicYear.id}
            teachers={activeTeachers}
            subjects={activeSubjects}
            classes={activeClasses}
          />
        )}
      </div>

      {/* Bagian permintaan pemilik produk (Jadwal #5) — dikelompokkan per
          Guru, bukan daftar datar satu baris per kombinasi Guru+Mapel+Kelas.
          Satu kartu = satu guru, isinya seluruh Mapel+Kelas yang dia ajar
          beserta total JP-nya (Bagian E.1.3, prinsip anti-scroll-panjang). */}
      <div className="mt-8">
        {assignments.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface"><EmptyState
            icon={<IconBebanMengajar size={16} strokeWidth={1.75} />}
            message="Belum ada beban mengajar untuk tahun ajaran ini."
          /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teacherGroups.map(({ teacherId, teacherName, totalJp, rows }) => (
              <section
                key={teacherId}
                className="rounded-2xl border border-hairline bg-surface-elevated p-4"
              >
                <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                  <p className="truncate text-[13.5px] font-medium text-ink">{teacherName}</p>
                  <span className="shrink-0 rounded-full border border-hairline-strong px-2 py-0.5 text-[11px] text-ink-muted">
                    {totalJp} JP
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {rows.map((a) => {
                    const usedClassIds = new Set(
                      assignments
                        .filter((x) => x.teacherId === a.teacherId && x.subjectId === a.subjectId)
                        .map((x) => x.classId),
                    );
                    const availableClasses = activeClasses.filter((c) => !usedClassIds.has(c.id));

                    return (
                      <EntityRow
                        key={a.id}
                        icon={<IconBebanMengajar size={14} strokeWidth={1.75} />}
                        name={`${a.subjectName} — ${a.className}`}
                        meta={`${a.targetJp} JP/minggu`}
                        status={a.status}
                        id={a.id}
                        toggleAction={toggleBebanMengajarStatusAction}
                        accentColor={getIdentityColor(a.subjectColorKey)?.accent}
                        expandable={{
                          icon: <Copy size={14} strokeWidth={1.75} />,
                          label: "Duplikat ke kelas lain",
                          panel: (
                            <DuplicateBebanMengajarForm
                              academicYearId={academicYear.id}
                              teacherId={a.teacherId}
                              teacherName={a.teacherName}
                              subjectId={a.subjectId}
                              subjectName={a.subjectName}
                              defaultTargetJp={a.targetJp}
                              availableClasses={availableClasses}
                            />
                          ),
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
