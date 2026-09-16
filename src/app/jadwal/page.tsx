import Link from "next/link";

export default function JadwalPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <h1 className="text-[18px] font-semibold text-ink">Jadwal</h1>
      <p className="text-[13.5px] text-ink-muted">
        Kanvas jadwal dan Scheduling Engine belum dibangun — menyusul pada
        fase berikutnya. Mulai dengan menyiapkan Struktur Waktu.
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
