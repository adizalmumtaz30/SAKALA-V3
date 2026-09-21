import { getIdentityColor } from "@/lib/domain/identity-color";

/**
 * components/entities/ (audit arsitektur shadcn/Base UI) — level "SAKALA
 * memahami entity, belum memahami halaman tertentu". Semua tempat yang
 * menampilkan Mapel pakai ini, supaya warna identitas & bentuk visualnya
 * SELALU konsisten — tidak setiap halaman menggambar ulang sendiri.
 *
 * ui/ tidak boleh tahu soal "Mapel". Ini kenapa badge ini hidup di
 * entities/, bukan ui/ — dia domain-aware (tahu warna identitas datang
 * dari lib/domain/identity-color), tapi belum tahu halaman/fitur tertentu.
 */
export function SubjectBadge({
  name,
  colorKey,
}: {
  name: string;
  colorKey: string | null;
}) {
  const color = getIdentityColor(colorKey);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-2.5 py-1 text-[12px] text-ink"
      style={color ? { backgroundColor: color.tintDark } : undefined}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color?.accent ?? "var(--color-ink-faint)" }}
      />
      {name}
    </span>
  );
}
