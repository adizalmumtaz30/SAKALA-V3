import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listTeachers } from "@/lib/data-access/teacher";
import { listSubjects } from "@/lib/data-access/subject";
import { listClassesForYear } from "@/lib/data-access/class";
import { listTeachingAssignmentsForYear } from "@/lib/data-access/teaching-assignment";
import { toggleBebanMengajarStatusAction } from "@/lib/application/teaching-assignment.actions";
import { CreateBebanMengajarForm } from "@/components/master-data/CreateBebanMengajarForm";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[20px] font-semibold text-ink">Beban Mengajar</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Tahun ajaran {academicYear.label} — hubungkan Guru, Mata Pelajaran,
        dan Kelas beserta target JP mingguan.
      </p>

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

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {assignments.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            Belum ada beban mengajar untuk tahun ajaran ini.
          </p>
        )}
        {assignments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-[13.5px] text-ink">
                {a.teacherName} — {a.subjectName} — {a.className}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[12px] text-ink-muted">
                  {a.targetJp} JP/minggu
                </span>
                <StatusBadge status={a.status} />
              </div>
            </div>
            <ToggleStatusButton
              id={a.id}
              status={a.status}
              action={toggleBebanMengajarStatusAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
