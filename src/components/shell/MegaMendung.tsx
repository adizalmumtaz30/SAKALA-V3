/**
 * MOTIF MEGA MENDUNG (Bagian E.1.7, LOCKED)
 *
 * Aturan yang dipatuhi:
 *  - Garis awan berlapis khas Mega Mendung, eksekusi halus: garis tipis,
 *    opasitas rendah, gradasi lembut. BUKAN batik literal.
 *  - Opasitas sangat rendah di area teks (3–6%) — motif kalah prioritas
 *    dari keterbacaan. Di sidebar boleh sedikit lebih tegas.
 *  - SVG pattern inline, bukan file gambar besar — tajam di semua resolusi.
 *  - pointer-events: none, tidak mengganggu interaksi.
 *  - Warna mengikuti currentColor supaya otomatis menyesuaikan tema,
 *    bukan biru Cirebon mentah yang bentrok dengan palet.
 *
 * "The heritage is discovered, not displayed."
 */

interface MegaMendungProps {
  /** "content" = sangat samar (area teks). "sidebar" = sedikit lebih tegas. */
  variant?: "content" | "sidebar";
  className?: string;
}

export function MegaMendung({
  variant = "content",
  className = "",
}: MegaMendungProps) {
  const opacity = variant === "sidebar" ? 0.07 : 0.045;
  const id = `megamendung-${variant}`;

  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full text-ink ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={id}
          width="180"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Tiga lapis kontur awan — inti Mega Mendung adalah pengulangan
              garis berlapis yang makin melebar, bukan bentuk awan tunggal. */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          >
            <path d="M-20 70 q22 -34 46 -4 q16 20 34 2 q20 -20 38 4 q16 22 38 -2 q18 -20 40 6" />
            <path d="M-20 82 q26 -40 54 -6 q18 22 38 2 q22 -22 42 4 q18 24 42 -2 q20 -22 44 6" />
            <path d="M-20 94 q30 -46 62 -8 q20 24 42 2 q24 -24 46 4 q20 26 46 -2 q22 -24 48 6" />
          </g>
          {/* Lapis kedua, digeser — memberi kesan awan bertumpuk tanpa
              membuat pola terlihat seperti ubin berulang yang kaku. */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            transform="translate(90, -58)"
          >
            <path d="M-20 70 q22 -34 46 -4 q16 20 34 2 q20 -20 38 4 q16 22 38 -2 q18 -20 40 6" />
            <path d="M-20 82 q26 -40 54 -6 q18 22 38 2 q22 -22 42 4 q18 24 42 -2 q20 -22 44 6" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
