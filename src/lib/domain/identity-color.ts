/**
 * SISTEM IDENTITAS WARNA TUNGGAL (Bagian E.1.2, LOCKED)
 *
 * Aturan yang dipatuhi file ini:
 *  1. Minimal 20 warna berbeda & mudah dibedakan.
 *  2. Warna melekat ke SATU entitas saja — di sini MATA PELAJARAN.
 *     Tidak pernah ke Guru juga; itu akan membuat identitas ganda.
 *  4. Jewel tone & muted luxury, bukan warna primer mentah.
 *  5. READABILITY DI ATAS SEGALANYA — warna dipakai sebagai tint latar +
 *     strip aksen, teks selalu memakai pasangan kontras yang sudah diuji,
 *     bukan fill solid kuat.
 *  6. Stabil — key disimpan di DB, tidak diacak ulang di frontend.
 *
 * Disimpan sebagai KEY bukan hex supaya varian dark/light bisa berbeda
 * tanpa perlu migrasi data.
 */

export interface IdentityColor {
  key: string;
  label: string;
  /** Strip aksen & titik penanda — pekat, dipakai pada area kecil. */
  accent: string;
  /** Tint latar kartu/sel — sangat lembut supaya teks tetap terbaca. */
  tintDark: string;
  tintLight: string;
}

export const IDENTITY_COLORS: IdentityColor[] = [
  { key: "deep-teal",   label: "Deep Teal",   accent: "#2E8B85", tintDark: "rgba(46,139,133,0.14)",  tintLight: "rgba(46,139,133,0.10)" },
  { key: "burgundy",    label: "Burgundy",    accent: "#8C3A4A", tintDark: "rgba(140,58,74,0.16)",   tintLight: "rgba(140,58,74,0.10)" },
  { key: "forest",      label: "Forest",      accent: "#3F6B4A", tintDark: "rgba(63,107,74,0.16)",   tintLight: "rgba(63,107,74,0.10)" },
  { key: "ochre",       label: "Ochre",       accent: "#9A7434", tintDark: "rgba(154,116,52,0.16)",  tintLight: "rgba(154,116,52,0.10)" },
  { key: "aubergine",   label: "Aubergine",   accent: "#6B4573", tintDark: "rgba(107,69,115,0.16)",  tintLight: "rgba(107,69,115,0.10)" },
  { key: "navy",        label: "Navy",        accent: "#3A5580", tintDark: "rgba(58,85,128,0.16)",   tintLight: "rgba(58,85,128,0.10)" },
  { key: "terracotta",  label: "Terracotta",  accent: "#A55A42", tintDark: "rgba(165,90,66,0.16)",   tintLight: "rgba(165,90,66,0.10)" },
  { key: "sage",        label: "Sage",        accent: "#6E8A6B", tintDark: "rgba(110,138,107,0.16)", tintLight: "rgba(110,138,107,0.10)" },
  { key: "slate-blue",  label: "Slate Blue",  accent: "#5A6E92", tintDark: "rgba(90,110,146,0.16)",  tintLight: "rgba(90,110,146,0.10)" },
  { key: "rust",        label: "Rust",        accent: "#96502F", tintDark: "rgba(150,80,47,0.16)",   tintLight: "rgba(150,80,47,0.10)" },
  { key: "plum",        label: "Plum",        accent: "#7D4260", tintDark: "rgba(125,66,96,0.16)",   tintLight: "rgba(125,66,96,0.10)" },
  { key: "moss",        label: "Moss",        accent: "#5C7346", tintDark: "rgba(92,115,70,0.16)",   tintLight: "rgba(92,115,70,0.10)" },
  { key: "steel",       label: "Steel",       accent: "#5D7480", tintDark: "rgba(93,116,128,0.16)",  tintLight: "rgba(93,116,128,0.10)" },
  { key: "amber-deep",  label: "Deep Amber",  accent: "#A8763B", tintDark: "rgba(168,118,59,0.16)",  tintLight: "rgba(168,118,59,0.10)" },
  { key: "indigo",      label: "Indigo",      accent: "#4C4C85", tintDark: "rgba(76,76,133,0.16)",   tintLight: "rgba(76,76,133,0.10)" },
  { key: "clay",        label: "Clay",        accent: "#8E6552", tintDark: "rgba(142,101,82,0.16)",  tintLight: "rgba(142,101,82,0.10)" },
  { key: "emerald-mut", label: "Muted Emerald", accent: "#3D7A63", tintDark: "rgba(61,122,99,0.16)", tintLight: "rgba(61,122,99,0.10)" },
  { key: "mauve",       label: "Mauve",       accent: "#87607A", tintDark: "rgba(135,96,122,0.16)",  tintLight: "rgba(135,96,122,0.10)" },
  { key: "olive",       label: "Olive",       accent: "#7A7A3F", tintDark: "rgba(122,122,63,0.16)",  tintLight: "rgba(122,122,63,0.10)" },
  { key: "cobalt-mut",  label: "Muted Cobalt", accent: "#3E6E96", tintDark: "rgba(62,110,150,0.16)", tintLight: "rgba(62,110,150,0.10)" },
  { key: "brick",       label: "Brick",       accent: "#93453F", tintDark: "rgba(147,69,63,0.16)",   tintLight: "rgba(147,69,63,0.10)" },
  { key: "pine",        label: "Pine",        accent: "#39655C", tintDark: "rgba(57,101,92,0.16)",   tintLight: "rgba(57,101,92,0.10)" },
];

const BY_KEY = new Map(IDENTITY_COLORS.map((c) => [c.key, c]));

/**
 * Menurunkan varian opasitas lain dari rgba() yang sudah ada, TANPA
 * menambah field baru per warna (hindari 22 baris rawan salah ketik).
 * Dipakai untuk sel Kanvas Jadwal, yang butuh tint sedikit lebih tegas
 * daripada badge/swatch kecil supaya identitas warna benar-benar
 * "nampak" — tetap tint (bukan fill solid), jadi prinsip readability-
 * di-atas-segalanya (aturan #5 di atas) tidak dilanggar, cuma alpha-nya
 * dinaikkan dari basis yang sama.
 */
export function withAlpha(rgba: string, alpha: number): string {
  const match = rgba.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  if (!match) return rgba;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getIdentityColor(key: string | null | undefined): IdentityColor | null {
  if (!key) return null;
  return BY_KEY.get(key) ?? null;
}

/**
 * Aturan 3: pemilih warna menampilkan sebanyak jumlah data, bukan selalu 20.
 * Kalau ada 12 mapel, tawarkan 12 slot — tapi minimal 6 supaya operator
 * tetap punya pilihan berarti saat data masih sedikit.
 */
export function paletteForCount(count: number): IdentityColor[] {
  const size = Math.min(IDENTITY_COLORS.length, Math.max(6, count));
  return IDENTITY_COLORS.slice(0, size);
}

/**
 * Warna yang belum terpakai, supaya saran otomatis tidak menabrak
 * mapel lain. Kalau semua sudah terpakai, mulai berputar lagi.
 */
export function nextAvailableColorKey(usedKeys: (string | null)[]): string {
  const used = new Set(usedKeys.filter(Boolean) as string[]);
  const free = IDENTITY_COLORS.find((c) => !used.has(c.key));
  return (free ?? IDENTITY_COLORS[used.size % IDENTITY_COLORS.length]).key;
}
