import type { Teacher } from "@/lib/domain/teacher";
import type { Subject } from "@/lib/domain/subject";
import type { SchoolClass } from "@/lib/domain/class";
import type { TeachingAssignment } from "@/lib/domain/teaching-assignment";
import type { TimeSlot } from "@/lib/domain/time-structure";
import type { DiagnosticIssue } from "@/lib/domain/diagnostic";

interface DiagnosticInput {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  assignments: TeachingAssignment[];
  timeSlots: TimeSlot[];
}

/**
 * Deterministic checks only — no engine internals, no fabricated numbers.
 * Order follows Bagian 68 (Internal Diagnostic Order): data dasar first,
 * then teaching requirements, then time structure, then slot availability.
 */
export function computeDiagnosticIssues(input: DiagnosticInput): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const activeAssignments = input.assignments.filter((a) => a.status === "active");

  // --- Data dasar ---------------------------------------------------------
  if (!input.teachers.some((t) => t.status === "active")) {
    issues.push({
      severity: "blocked",
      message: "Belum ada guru aktif.",
      href: "/guru",
      actionLabel: "Tambah Guru",
    });
  }
  if (!input.subjects.some((s) => s.status === "active")) {
    issues.push({
      severity: "blocked",
      message: "Belum ada mata pelajaran aktif.",
      href: "/mapel",
      actionLabel: "Tambah Mapel",
    });
  }
  if (!input.classes.some((c) => c.status === "active")) {
    issues.push({
      severity: "blocked",
      message: "Belum ada kelas aktif untuk tahun ajaran ini.",
      href: "/kelas",
      actionLabel: "Tambah Kelas",
    });
  }

  // --- Kebutuhan mengajar: guru/mapel/kelas nonaktif tapi masih dipakai --
  const inactiveTeacherIds = new Set(
    input.teachers.filter((t) => t.status === "inactive").map((t) => t.id),
  );
  const inactiveSubjectIds = new Set(
    input.subjects.filter((s) => s.status === "inactive").map((s) => s.id),
  );
  const inactiveClassIds = new Set(
    input.classes.filter((c) => c.status === "inactive").map((c) => c.id),
  );

  for (const a of activeAssignments) {
    if (inactiveTeacherIds.has(a.teacherId)) {
      issues.push({
        severity: "attention",
        message: `${a.teacherName} sudah nonaktif, tetapi masih punya beban mengajar ${a.subjectName} di ${a.className}.`,
        href: "/beban-mengajar",
        actionLabel: "Lihat Beban Mengajar",
      });
    }
    if (inactiveSubjectIds.has(a.subjectId)) {
      issues.push({
        severity: "attention",
        message: `${a.subjectName} sudah nonaktif, tetapi masih dipakai di beban mengajar ${a.teacherName} — ${a.className}.`,
        href: "/beban-mengajar",
        actionLabel: "Lihat Beban Mengajar",
      });
    }
    if (inactiveClassIds.has(a.classId)) {
      issues.push({
        severity: "attention",
        message: `${a.className} sudah nonaktif, tetapi masih punya beban mengajar ${a.subjectName} (${a.teacherName}).`,
        href: "/beban-mengajar",
        actionLabel: "Lihat Beban Mengajar",
      });
    }
  }

  // --- Struktur waktu ------------------------------------------------------
  const activeSlots = input.timeSlots.filter((s) => s.status === "active");
  const teachingSlotCount = activeSlots.filter((s) => s.type === "mengajar").length;

  if (activeAssignments.length > 0 && activeSlots.length === 0) {
    issues.push({
      severity: "blocked",
      message:
        "Struktur waktu belum diatur. Jadwal belum dapat dibuat sebelum ini tersedia.",
      href: "/jadwal/struktur-waktu",
      actionLabel: "Atur Struktur Waktu",
    });
  }

  // --- Ketersediaan slot: total target JP per kelas vs slot mengajar/minggu
  if (activeSlots.length > 0) {
    const targetJpByClass = new Map<string, { className: string; total: number }>();
    for (const a of activeAssignments) {
      const existing = targetJpByClass.get(a.classId);
      if (existing) {
        existing.total += a.targetJp;
      } else {
        targetJpByClass.set(a.classId, { className: a.className, total: a.targetJp });
      }
    }
    for (const { className, total } of targetJpByClass.values()) {
      if (total > teachingSlotCount) {
        issues.push({
          severity: "blocked",
          message: `${className} butuh ${total} JP/minggu, tetapi struktur waktu cuma menyediakan ${teachingSlotCount} slot mengajar/minggu.`,
          href: "/jadwal/struktur-waktu",
          actionLabel: "Tambah Slot Mengajar",
        });
      }
    }
  }

  return issues;
}
