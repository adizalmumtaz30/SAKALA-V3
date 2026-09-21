import { IconGuru } from "@/components/icons";

/**
 * Satu tempat yang tahu "bagaimana menampilkan seorang Guru". Kalau nanti
 * Human Identity System (avatar foto/premium) jadi dikerjakan, cukup ubah
 * file ini — setiap pemanggil (Laporan, Riwayat, Absensi, dst) otomatis
 * ikut berubah tanpa disentuh satu per satu.
 */
export function TeacherBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink">
      <IconGuru size={14} strokeWidth={1.75} className="shrink-0 text-ink-faint" />
      {name}
    </span>
  );
}
