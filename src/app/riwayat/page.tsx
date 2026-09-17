import Link from "next/link";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAcademicYear } from "@/lib/data-access/academic-year";
import { listHistory } from "@/lib/data-access/history";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ENTITY_LABEL: Record<string, string> = {
  guru: "Guru",
  mapel: "Mapel",
  kelas: "Kelas",
  ruang: "Ruang",
  beban_mengajar: "Beban Mengajar",
  struktur_waktu: "Struktur Waktu",
  tahun_ajaran: "Tahun Ajaran",
  sekolah: "Sekolah",
};

export default async function RiwayatPage() {
  const supabase = await createClient();
  const academicYear = await getWorkspaceAcademicYear(supabase);

  if (!academicYear) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Tahun ajaran belum aktif
        </h1>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink"
        >
          Ke Beranda
        </Link>
      </div>
    );
  }

  const entries = await listHistory(supabase, academicYear.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader
        kicker="RIWAYAT"
        title="Riwayat Perubahan"
        description={`Tahun ajaran ${academicYear.label} — jejak audit, bukan konfigurasi.`}
      />

      <div className="mt-6 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {entries.length === 0 && (
          <EmptyState
            icon={<History size={16} strokeWidth={1.75} />}
            message="Belum ada riwayat perubahan untuk tahun ajaran ini."
          />
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-ink-faint">
                {ENTITY_LABEL[entry.entityType] ?? entry.entityType}
              </span>
              <span className="text-[11px] text-ink-faint">·</span>
              <span className="text-[11px] text-ink-faint">
                {formatDateTime(entry.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink">{entry.summary}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-faint">
              oleh {entry.actor}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
