"use client";

import { useActionState, useEffect } from "react";
import {
  createBebanMengajarAction,
  type FormState,
} from "@/lib/application/teaching-assignment.actions";
import { useExpandableClose } from "@/components/master-data/EntityRow";
import type { SchoolClass } from "@/lib/domain/class";

const initialState: FormState = {};

interface Props {
  academicYearId: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  defaultTargetJp: number;
  /** Kelas yang BELUM punya kombinasi Guru+Mapel ini — kelas yang sudah
   *  dipakai tidak ditawarkan lagi, sama seperti aturan di kanvas jadwal:
   *  jangan sampai operator memilih sesuatu yang pasti ditolak sistem. */
  availableClasses: SchoolClass[];
}

/**
 * Bagian VI.5 — Duplikat sebagai titik awal.
 *
 * "Guru A di kelas 7A, 7B, 7C" biasanya berarti mengisi form yang sama tiga
 * kali dengan satu perbedaan. Panel ini membalik urutannya: Guru, Mapel, dan
 * JP sudah TERISI dari baris asal (tampil sebagai teks, bukan input lagi —
 * tidak ada yang bisa diketik ulang secara tidak sengaja); operator cuma
 * memilih Kelas mana yang berbeda.
 */
export function DuplicateBebanMengajarForm({
  academicYearId,
  teacherId,
  teacherName,
  subjectId,
  subjectName,
  defaultTargetJp,
  availableClasses,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createBebanMengajarAction,
    initialState,
  );
  // §Bugfix runtime — sebelumnya diterima sebagai prop `onDone` (function)
  // dari Server Component pemanggil, ilegal lintas batas RSC. Sekarang
  // dibaca lewat context yang disediakan EntityRow sendiri (client).
  const close = useExpandableClose();

  // Beri operator waktu membaca konfirmasi sebelum panel menutup sendiri.
  // Effect, bukan pemanggilan langsung di body render — supaya timer cuma
  // dijadwalkan SEKALI saat sukses berubah jadi true, bukan setiap render
  // selama state.success tetap truthy.
  useEffect(() => {
    if (!state.success) return;
    const t = setTimeout(() => close?.(), 900);
    return () => clearTimeout(t);
  }, [state.success, close]);

  if (availableClasses.length === 0) {
    return (
      <p className="text-[12.5px] text-ink-muted">
        {teacherName} sudah mengajar {subjectName} di semua kelas aktif —
        tidak ada kelas lain untuk diduplikat.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="subjectId" value={subjectId} />

      <p className="text-[12px] text-ink-muted">
        Duplikat <span className="text-ink">{teacherName}</span> —{" "}
        <span className="text-ink">{subjectName}</span> ke kelas lain
      </p>

      <div className="flex flex-wrap gap-2">
        {availableClasses.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] text-ink-muted has-checked:border-accent-teal has-checked:text-ink"
          >
            <input
              type="checkbox"
              name="classIds"
              value={c.id}
              className="accent-accent-teal"
            />
            {c.name}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[12.5px] text-ink-muted">JP/minggu</label>
        <input
          name="targetJp"
          type="number"
          min={1}
          required
          defaultValue={defaultTargetJp}
          className="w-20 rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-accent-teal"
        />
      </div>

      {state.error && (
        <p className="text-[12px] text-status-blocked">{state.error}</p>
      )}
      {state.success && (
        <p className="text-[12px] text-status-ready">✓ {state.success}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent-teal px-3.5 py-1.5 text-[12.5px] font-medium text-accent-teal-ink disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Duplikat"}
        </button>
        <button
          type="button"
          onClick={() => close?.()}
          className="rounded-lg px-3 py-1.5 text-[12.5px] text-ink-muted hover:text-ink"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
