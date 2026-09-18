/**
 * Bagian V.6 — ilustrasi 3D untuk Beranda.
 *
 * Gaya: isometric flat 3D (referensi Stripe/Linear), bukan render 3D
 * sungguhan — three.js/WebGL sengaja dihindari untuk hiasan (prinsip
 * "kemewahan tidak boleh memperlambat", Bagian F). SVG statis, sekitar 2KB,
 * instan dimuat, tajam di resolusi apa pun.
 *
 * Temanya "modul data menumpuk jadi satu jadwal" — tiga balok isometric
 * (Guru/Mapel/Kelas -> Beban Mengajar) dengan kartu kalender kecil di atas
 * balok tertinggi, cocok dengan konteks Beranda (ringkasan kesiapan data)
 * tempat ilustrasi ini dipasang. Warna lewat CSS var yang sudah ada
 * (--color-accent-teal, --color-champagne, dll), jadi otomatis mengikuti
 * dark/light mode tanpa varian file terpisah.
 *
 * Murni dekoratif — tidak pernah menggantikan status data yang jujur
 * (checklist & IssueList di sampingnya tetap sumber kebenaran).
 */
export function DashboardHeroIllustration() {
  return (
    <div
      aria-hidden
      data-print="hide"
      className="pointer-events-none relative hidden h-[168px] w-[190px] shrink-0 md:block"
    >
      {/* Glow ambient — pola yang sama dengan "Atmospheric heritage layer"
          yang sudah ada di halaman ini. */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-champagne), transparent 72%)",
        }}
      />
      <svg
        viewBox="0 0 220 210"
        className="relative h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="hero-shadow" x="-30%" y="-10%" width="160%" height="140%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="6"
              floodColor="var(--color-ink)"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        {/* Bayangan lantai ambient */}
        <ellipse
          cx="112"
          cy="188"
          rx="88"
          ry="10"
          fill="var(--color-ink)"
          opacity="0.06"
        />

        <g filter="url(#hero-shadow)">
          {/* Balok 1 — netral, "Data Dasar" */}
          <g>
            <path
              d="M54 132 L74 122 L74 168 L54 178 Z"
              fill="color-mix(in srgb, var(--color-surface-focus), black 18%)"
            />
            <path
              d="M34 122 L54 132 L54 178 L34 168 Z"
              fill="color-mix(in srgb, var(--color-surface-focus), black 32%)"
            />
            <path
              d="M34 122 L54 112 L74 122 L54 132 Z"
              fill="color-mix(in srgb, var(--color-surface-focus), white 30%)"
            />
          </g>

          {/* Balok 2 — accent teal, "Sedang berjalan" */}
          <g>
            <path
              d="M104 104 L124 94 L124 168 L104 178 Z"
              fill="color-mix(in srgb, var(--color-accent-teal), black 12%)"
            />
            <path
              d="M84 94 L104 104 L104 178 L84 168 Z"
              fill="color-mix(in srgb, var(--color-accent-teal), black 28%)"
            />
            <path
              d="M84 94 L104 84 L124 94 L104 104 Z"
              fill="color-mix(in srgb, var(--color-accent-teal), white 26%)"
            />
          </g>

          {/* Balok 3 — champagne, paling tinggi: aksen "premium" */}
          <g>
            <path
              d="M154 74 L174 64 L174 168 L154 178 Z"
              fill="color-mix(in srgb, var(--color-champagne), black 10%)"
            />
            <path
              d="M134 64 L154 74 L154 178 L134 168 Z"
              fill="color-mix(in srgb, var(--color-champagne), black 26%)"
            />
            <path
              d="M134 64 L154 54 L174 64 L154 74 Z"
              fill="color-mix(in srgb, var(--color-champagne), white 34%)"
            />
          </g>

          {/* Kartu kalender kecil melayang di atas balok tertinggi —
              merepresentasikan Jadwal sebagai muara dari data-data ini. */}
          <g transform="translate(140, 26)">
            <rect
              x="0"
              y="4"
              width="34"
              height="28"
              rx="4"
              fill="var(--color-surface)"
              stroke="var(--color-hairline-strong)"
              strokeWidth="1"
            />
            <rect
              x="0"
              y="4"
              width="34"
              height="9"
              rx="4"
              fill="var(--color-accent-teal)"
              opacity="0.9"
            />
            {[0, 1, 2].map((row) =>
              [0, 1, 2, 3].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={4 + col * 7.5}
                  y={17 + row * 5.5}
                  width="5"
                  height="3.4"
                  rx="1"
                  fill="var(--color-ink-faint)"
                  opacity={row === 0 && col === 1 ? 0 : 0.35}
                />
              )),
            )}
            {/* Satu sel ditonjolkan — "sudah terisi" */}
            <rect
              x={4 + 1 * 7.5}
              y={17}
              width="5"
              height="3.4"
              rx="1"
              fill="var(--color-champagne)"
            />
          </g>

          {/* Bintik aksen mengambang — sentuhan premium, sangat halus */}
          <circle cx="30" cy="70" r="2.5" fill="var(--color-champagne)" opacity="0.5" />
          <circle cx="196" cy="120" r="2" fill="var(--color-accent-teal)" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}
