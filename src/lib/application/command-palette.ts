import type { SupabaseClient } from "@supabase/supabase-js";
import { listTeachers } from "@/lib/data-access/teacher";
import { listSubjects } from "@/lib/data-access/subject";
import { listClassesForYear } from "@/lib/data-access/class";
import { listRooms } from "@/lib/data-access/room";
import { getIdentityColor } from "@/lib/domain/identity-color";

/**
 * Bagian F.3 — Pencarian & lompat global (Ctrl/Cmd+K).
 *
 * Alasan ada: untuk membuka satu data guru, operator harus klik menu Guru →
 * tunggu muat → cari di daftar → klik. Empat langkah untuk tujuan yang sudah
 * dia tahu. Palette memangkasnya jadi satu: ketik nama → Enter.
 *
 * Dibangun sebagai jalan pintas OPSIONAL — tidak mengubah alur navigasi yang
 * sudah ada, tidak menambah elemen UI permanen apa pun (cuma overlay yang
 * dipanggil). Prinsip "sedikit klik": menambah nol klik, memangkas tiga.
 */
export type CommandGroup = "Navigasi" | "Guru" | "Mapel" | "Kelas" | "Ruang";

export interface CommandItem {
  id: string;
  name: string;
  group: CommandGroup;
  href: string;
  /** Keterangan kecil di kanan, mis. status nonaktif. */
  hint?: string;
  /** Warna identitas (Mapel) — dipakai sebagai titik aksen, bukan fill. */
  accentColor?: string;
}

/** Menu selalu tersedia walau data master masih kosong. */
export const NAV_COMMANDS: CommandItem[] = [
  { id: "nav-beranda", name: "Beranda", group: "Navigasi", href: "/" },
  { id: "nav-guru", name: "Guru", group: "Navigasi", href: "/guru" },
  { id: "nav-mapel", name: "Mapel", group: "Navigasi", href: "/mapel" },
  { id: "nav-kelas", name: "Kelas", group: "Navigasi", href: "/kelas" },
  { id: "nav-ruang", name: "Ruang", group: "Navigasi", href: "/ruang" },
  {
    id: "nav-beban",
    name: "Beban Mengajar",
    group: "Navigasi",
    href: "/beban-mengajar",
  },
  { id: "nav-import", name: "Import / Sinkronisasi", group: "Navigasi", href: "/import" },
  { id: "nav-jadwal", name: "Kanvas Jadwal", group: "Navigasi", href: "/jadwal" },
  {
    id: "nav-struktur",
    name: "Struktur Waktu",
    group: "Navigasi",
    href: "/jadwal/struktur-waktu",
  },
  { id: "nav-absensi", name: "Absensi", group: "Navigasi", href: "/absensi" },
  { id: "nav-laporan", name: "Laporan", group: "Navigasi", href: "/laporan" },
  { id: "nav-riwayat", name: "Riwayat", group: "Navigasi", href: "/riwayat" },
  { id: "nav-settings", name: "Settings", group: "Navigasi", href: "/settings" },
];

/**
 * Dipanggil sekali di layout (server). Data master di sekolah berukuran
 * ratusan baris, jadi dimuat penuh sekali lalu difilter di klien — jauh lebih
 * responsif daripada round-trip per ketikan, dan tidak ada state server yang
 * perlu dijaga.
 */
export async function loadCommandItems(
  supabase: SupabaseClient,
  academicYearId: string | null,
): Promise<CommandItem[]> {
  const [teachers, subjects, classes, rooms] = await Promise.all([
    listTeachers(supabase).catch(() => []),
    listSubjects(supabase).catch(() => []),
    academicYearId
      ? listClassesForYear(supabase, academicYearId).catch(() => [])
      : Promise.resolve([]),
    listRooms(supabase).catch(() => []),
  ]);

  const inactive = (status: string) =>
    status === "inactive" ? "nonaktif" : undefined;

  return [
    ...NAV_COMMANDS,
    ...teachers.map((t) => ({
      id: `guru-${t.id}`,
      name: t.name,
      group: "Guru" as const,
      href: `/guru?highlight=${t.id}`,
      hint: inactive(t.status),
    })),
    ...subjects.map((s) => ({
      id: `mapel-${s.id}`,
      name: s.name,
      group: "Mapel" as const,
      href: `/mapel?highlight=${s.id}`,
      hint: inactive(s.status),
      accentColor: getIdentityColor(s.colorKey)?.accent,
    })),
    ...classes.map((c) => ({
      id: `kelas-${c.id}`,
      name: c.name,
      group: "Kelas" as const,
      href: `/kelas?highlight=${c.id}`,
      hint: inactive(c.status),
    })),
    ...rooms.map((r) => ({
      id: `ruang-${r.id}`,
      name: r.name,
      group: "Ruang" as const,
      href: `/ruang?highlight=${r.id}`,
      hint: inactive(r.status),
    })),
  ];
}
