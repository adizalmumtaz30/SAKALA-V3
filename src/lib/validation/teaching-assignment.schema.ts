import { z } from "zod";

/**
 * Contoh pola validasi terstruktur (UI_WORKFLOW.md) menggantikan rangkaian
 * `if (!x) return {error}` manual. Pesan error tetap bahasa manusia
 * (Bagian C.10, LOCKED) — Zod cuma mengganti CARA validasinya ditulis,
 * bukan mengubah nada pesannya jadi teknis.
 */
export const createBebanMengajarSchema = z.object({
  academicYearId: z.string().min(1, "Tahun ajaran belum aktif."),
  teacherId: z.string().min(1, "Pilih guru terlebih dahulu."),
  subjectId: z.string().min(1, "Pilih mata pelajaran terlebih dahulu."),
  classIds: z.array(z.string()).min(1, "Pilih minimal satu kelas."),
  targetJp: z.coerce
    .number()
    .int("JP / minggu harus berupa angka bulat.")
    .positive("JP / minggu harus berupa angka lebih dari 0."),
});

export type CreateBebanMengajarInput = z.infer<typeof createBebanMengajarSchema>;
