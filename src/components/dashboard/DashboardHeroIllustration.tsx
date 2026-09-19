/**
 * Dashboard hero — Constraint Weave × Scheduling Blueprint × S Geometry.
 *
 * Bagian E.1.7 / master blueprint:
 * - no central core, orb, radial orbit, or literal dashboard diagram
 * - each domain is a visual grammar
 * - Waktu is a continuous temporal coordinate spine
 * - relationship and movement carry the intelligence
 * - state changes parameters, not the underlying composition
 */
interface DashboardHeroIllustrationProps {
  state: "ready" | "warning" | "missing";
  schoolName: string;
  academicYear: string;
  teacherCount: number;
  subjectCount: number;
  classCount: number;
  assignmentCount: number;
  timeSlotCount: number;
  issueCount: number;
}

const stateCopy = {
  ready: {
    eyebrow: "KESIAPAN SISTEM",
    title: "SIAP UNTUK PENJADWALAN",
    body: "Data inti sudah saling terhubung. Constraint dapat dibaca melalui waktu, kelas, dan beban mengajar tanpa menambah kompleksitas ke operator.",
    label: "Sistem siap",
  },
  warning: {
    eyebrow: "KESIAPAN SISTEM",
    title: "PERLU PENYESUAIAN",
    body: "Struktur data tersedia, tetapi ada kondisi yang perlu diperiksa sebelum sistem dapat dijadwalkan dengan aman.",
    label: "Perlu dicek",
  },
  missing: {
    eyebrow: "KESIAPAN SISTEM",
    title: "LENGKAPI STRUKTUR SISTEM",
    body: "Hubungan data dasar sudah tersedia. Lengkapi beban mengajar dan struktur waktu agar sistem dapat membaca ruang penjadwalan.",
    label: "Data belum lengkap",
  },
} as const;

function DataMetric({
  label,
  value,
  state,
}: {
  label: string;
  value: number | string;
  state?: "ready" | "warning" | "missing";
}) {
  return (
    <div className="dashboard-data-metric">
      <span className="dashboard-data-label">{label}</span>
      <span className="dashboard-data-value">{value}</span>
      {state && (
        <span className={`dashboard-data-state dashboard-data-state--${state}`}>
          {state === "ready" ? "SIAP" : state === "warning" ? "CEK" : "LENGKAPI"}
        </span>
      )}
    </div>
  );
}

export function DashboardHeroIllustration({
  state,
  schoolName,
  academicYear,
  teacherCount,
  subjectCount,
  classCount,
  assignmentCount,
  timeSlotCount,
  issueCount,
}: DashboardHeroIllustrationProps) {
  const copy = stateCopy[state];

  return (
    <section className="dashboard-hero" aria-label="Kesiapan sistem penjadwalan">
      <div className="dashboard-hero-surface">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-text">
            <p className="dashboard-eyebrow">{copy.eyebrow}</p>
            <h1 className="dashboard-hero-title">{copy.title}</h1>
            <p className="dashboard-hero-body">{copy.body}</p>

            <div className={`dashboard-hero-status dashboard-hero-status--${state}`}>
              <span className="dashboard-hero-status-dot" aria-hidden />
              <span>{copy.label}</span>
              <span className="dashboard-hero-status-divider" aria-hidden />
              <span className="dashboard-hero-context">
                {academicYear}
              </span>
            </div>

            <div className="dashboard-hero-meta">
              <span>{schoolName}</span>
              <span className="dashboard-hero-meta-separator" aria-hidden />
              <span>{issueCount > 0 ? `${issueCount} perhatian` : "Tidak ada perhatian aktif"}</span>
            </div>
          </div>

          <div className="dashboard-hero-field" aria-hidden>
            <svg
              viewBox="0 0 720 470"
              className="dashboard-constraint-svg"
              role="img"
            >
              <defs>
                <linearGradient id="dashboard-field-fade" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="var(--dashboard-blue)" stopOpacity="0" />
                  <stop offset="28%" stopColor="var(--dashboard-blue)" stopOpacity="0.45" />
                  <stop offset="78%" stopColor="var(--dashboard-blue)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--dashboard-blue)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dashboard-weave" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--dashboard-ivory)" stopOpacity="0.72" />
                  <stop offset="55%" stopColor="var(--dashboard-blue)" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="var(--dashboard-champagne)" stopOpacity="0.62" />
                </linearGradient>
                <radialGradient id="dashboard-pressure" cx="52%" cy="52%" r="55%">
                  <stop offset="0%" stopColor="var(--dashboard-blue)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="var(--dashboard-blue)" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect x="28" y="28" width="670" height="430" rx="20" fill="url(#dashboard-pressure)" />
              <path
                className="dashboard-ghost-grid"
                d="M92 78V442 M156 86V450 M230 94V438 M306 84V450 M382 98V442 M468 82V450 M556 90V442 M636 76V444"
              />
              <path
                className="dashboard-ghost-grid dashboard-ghost-grid--local"
                d="M206 124H340 M252 176H438 M344 228H560 M430 286H650 M500 420H680"
              />

              {/* S01 / S02 — only selected trajectories carry the signature angles. */}
              <path
                className="dashboard-trajectory"
                d="M58 72 C138 84 162 116 206 164 S294 238 356 286 S456 332 528 392"
              />
              <path
                className="dashboard-trajectory dashboard-trajectory--secondary"
                d="M178 64 C232 110 226 152 270 208 S350 284 424 326 S510 372 612 428"
              />

              {/* G01–G05 — Guru grammar: vertical strands, not people/icons. */}
              <g className="dashboard-guru-strands">
                <path d="M88 86 C82 126 88 168 84 210" />
                <path d="M110 102 C104 142 116 182 108 214" />
                <path d="M134 90 C128 130 144 172 132 218" />
                <path d="M156 112 C150 146 164 184 156 220" />
                <path d="M176 94 C172 134 182 172 178 214" />
              </g>

              {/* M01–M05 — Mapel grammar: horizontal semantic layers. */}
              <g className="dashboard-mapel-layers">
                <path d="M144 238 H354" />
                <path d="M170 252 H402" />
                <path d="M122 266 H328" />
                <path d="M194 280 H438" />
                <path d="M158 294 H382" />
              </g>

              {/* Primary weave — Guru ↔ Mapel handshake. */}
              <path
                className="dashboard-primary-weave"
                d="M128 204 C184 194 212 214 246 238 C278 260 318 282 354 306 C386 328 430 326 470 306"
              />
              <path
                className="dashboard-primary-weave dashboard-primary-weave--fine"
                d="M168 214 C212 224 238 246 276 264 C312 282 348 296 392 302"
              />

              {/* T01 — continuous temporal coordinate spine. */}
              <path
                className={`dashboard-temporal-spine dashboard-temporal-spine--${state}`}
                d="M118 356 H664"
              />

              {/* K01–K05 — Kelas grammar: sparse modular containers. */}
              <g className="dashboard-class-modules">
                <rect x="164" y="384" width="76" height="40" rx="4" />
                <rect x="268" y="394" width="92" height="42" rx="4" />
                <rect x="388" y="382" width="72" height="54" rx="4" />
                <rect x="486" y="398" width="96" height="38" rx="4" />
                <rect x="604" y="380" width="54" height="52" rx="4" />
              </g>

              {/* B01–Bxx — Beban grammar: distributed pressure/density field. */}
              <g className="dashboard-load-field">
                {Array.from({ length: 42 }, (_, index) => {
                  const col = index % 14;
                  const row = Math.floor(index / 14);
                  const x = 342 + col * 19 + ((row % 2) * 4);
                  const y = 408 + row * 14 + ((col % 3) * 2);
                  return <rect key={index} x={x} y={y} width="5" height="5" rx="1" />;
                })}
              </g>

              {/* I01–I05 — micro anchors. Crossing is not automatically a node. */}
              <g className="dashboard-anchors">
                <circle cx="128" cy="204" r="4" />
                <circle cx="356" cy="306" r="3" />
                <circle cx="470" cy="306" r="4" />
                <circle cx="460" cy="356" r="4" />
                <circle cx="582" cy="356" r="3" />
              </g>

              {/* Domain labels are sparse orientation, not floating badges. */}
              <g className="dashboard-domain-labels">
                <text x="74" y="58">GURU</text>
                <text x="122" y="228">MAPEL</text>
                <text x="150" y="378">KELAS</text>
                <text x="500" y="390">BEBAN</text>
                <text x="548" y="348">WAKTU</text>
              </g>

              <path className="dashboard-field-horizon" d="M92 446 H672" />
              <path className="dashboard-field-bleed" d="M52 112 C116 124 150 112 198 86" />
              <path className="dashboard-field-bleed dashboard-field-bleed--right" d="M584 318 C638 344 670 366 704 416" />
            </svg>
          </div>
        </div>

        <div className="dashboard-data-strip">
          <DataMetric label="GURU" value={teacherCount} />
          <DataMetric label="MAPEL" value={subjectCount} />
          <DataMetric label="KELAS" value={classCount} />
          <DataMetric label="BEBAN" value={assignmentCount} />
          <DataMetric
            label="STRUKTUR"
            value={timeSlotCount > 0 ? "✓" : "—"}
            state={timeSlotCount > 0 ? "ready" : "missing"}
          />
        </div>
      </div>
    </section>
  );
}
