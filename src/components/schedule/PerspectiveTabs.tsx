import Link from "next/link";

const PERSPECTIVES = [
  { key: "sekolah", label: "Sekolah" },
  { key: "kelas", label: "Kelas" },
  { key: "guru", label: "Guru" },
  { key: "ruang", label: "Ruang" },
] as const;

export function PerspectiveTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 rounded-lg border border-hairline bg-surface p-1">
      {PERSPECTIVES.map((p) => (
        <Link
          key={p.key}
          href={p.key === "sekolah" ? "/jadwal" : `/jadwal?view=${p.key}`}
          className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
            active === p.key
              ? "bg-surface-elevated text-ink"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
