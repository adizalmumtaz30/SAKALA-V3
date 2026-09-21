/**
 * Kelas tidak punya identity color sendiri (warna melekat ke Mapel, bukan
 * Kelas — Bagian E.1.2). Badge ini tetap ada supaya bentuk visualnya
 * konsisten dengan SubjectBadge/TeacherBadge di tempat yang sama (mis.
 * daftar Beban Mengajar di Drawer Guru), bukan campuran teks-polos +
 * pill-berwarna yang terlihat acak.
 */
export function ClassBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline-strong px-2.5 py-1 text-[12px] text-ink-muted">
      {name}
    </span>
  );
}
