import type { JpProgress } from "@/lib/domain/schedule";
import { getIdentityColor } from "@/lib/domain/identity-color";

/**
 * Rekap pemenuhan JP. Angkanya dihitung dari jadwal NYATA, bukan dari status
 * yang disimpan terpisah — supaya tidak pernah terjadi lagi "ringkasan hijau
 * padahal kanvas kosong" (insiden V2, 31 Agt).
 */
export function JpProgressPanel({ progress }: { progress: JpProgress[] }) {
  if (progress.length === 0) return null;

  const belum = progress.filter((p) => p.remainingJp > 0);
  const lengkap = progress.filter((p) => p.status === "lengkap").length;
  const lebih = progress.filter((p) => p.status === "lebih");

  const totalTarget = progress.reduce((s, p) => s + p.targetJp, 0);
  const totalScheduled = progress.reduce((s, p) => s + p.scheduledJp, 0);

  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[12px] font-medium text-ink">Pemenuhan Target JP</p>
        <p className="text-[12px] text-ink-muted">
          <span className="text-ink">{totalScheduled}</span> dari {totalTarget} JP
          terjadwal · {lengkap}/{progress.length} beban mengajar lengkap
        </p>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-accent-teal transition-[width] duration-500"
          style={{
            width: `${totalTarget === 0 ? 0 : Math.min(100, (totalScheduled / totalTarget) * 100)}%`,
          }}
        />
      </div>

      {belum.length > 0 && (
        <div className="mt-3.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Masih kurang ({belum.length})
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {belum.slice(0, 12).map((p) => {
              const color = getIdentityColor(p.subjectColorKey);
              return (
                <div
                  key={p.teachingAssignmentId}
                  className="flex items-center gap-2 rounded-lg border border-hairline px-2.5 py-1.5"
                >
                  <span
                    aria-hidden
                    className="h-5 w-[3px] shrink-0 rounded-full"
                    style={{ backgroundColor: color?.accent ?? "#888" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-ink">
                      {p.subjectName} — {p.className}
                    </span>
                    <span className="block truncate text-[10.5px] text-ink-muted">
                      {p.teacherName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-status-incomplete">
                    kurang {p.remainingJp}
                  </span>
                </div>
              );
            })}
          </div>
          {belum.length > 12 && (
            <p className="mt-1.5 text-[11px] text-ink-faint">
              …dan {belum.length - 12} lagi.
            </p>
          )}
        </div>
      )}

      {lebih.length > 0 && (
        <p className="mt-3 text-[12px] text-status-attention">
          {lebih.length} beban mengajar melebihi target JP-nya — periksa kembali.
        </p>
      )}

      {belum.length === 0 && lebih.length === 0 && (
        <p className="mt-3 text-[12px] text-status-ready">
          ✓ Semua target JP sudah terpenuhi persis.
        </p>
      )}
    </section>
  );
}
