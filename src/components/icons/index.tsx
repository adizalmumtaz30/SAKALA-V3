import type { SVGProps } from "react";

export interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function base(props: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: props.size ?? 17,
    height: props.size ?? 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: props.strokeWidth ?? 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: props.className,
  };
}

/** Guru — silhouette manusia dengan bentuk jubah akademik, bukan person-icon generik (Bagian XXVII). */
export function IconGuru(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="7.2" r="3" />
      <path d="M6 20c0-4.6 2.4-7.2 6-7.2s6 2.6 6 7.2" />
    </svg>
  );
}

/** Mapel — buku terbuka dengan garis jilid tengah (Bagian XXVIII). */
export function IconMapel(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.5C10 5 6.5 4.5 4 5v13c2.5-.5 6 0 8 1.5" />
      <path d="M12 6.5C14 5 17.5 4.5 20 5v13c-2.5-.5-6 0-8 1.5" />
      <path d="M12 6.5v14" />
    </svg>
  );
}

/** Kelas — modul geometris tersusun sebagai satu kelompok, bukan grid seragam (Bagian XXIX). */
export function IconKelas(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="9" height="8" rx="1.5" />
      <rect x="15" y="4" width="5" height="5" rx="1.3" />
      <rect x="15" y="11" width="5" height="9" rx="1.3" />
      <rect x="4" y="14" width="9" height="6" rx="1.3" />
    </svg>
  );
}

/** Ruang — architectural doorway / spatial frame (Bagian XXX). */
export function IconRuang(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 21V7.5C5 4.5 8 3 12 3s7 1.5 7 4.5V21" />
      <path d="M8.5 21V9c0-1.8 1.5-3 3.5-3s3.5 1.2 3.5 3v12" />
    </svg>
  );
}

/** Beban Mengajar — balok dengan bobot berbeda, tersusun seimbang (Bagian XXXI). */
export function IconBebanMengajar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V13" />
      <path d="M9.5 20V9" />
      <path d="M15 20V15" />
      <path d="M20 20V6" />
    </svg>
  );
}

/** Jadwal — timeline mengalir dengan titik simpul, bukan kalender kotak (Bagian XXXII). */
export function IconJadwal(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 15c2.5-6 5-6 7 0s4.5 6 7 0 4.5-6 4-9" />
      <circle cx="7.3" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Absensi — presence marker + penanda hari, bukan centang generik (Bagian XXXIII). */
export function IconAbsensi(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16" />
      <path d="M9 14.3l2 2 3.5-4" />
    </svg>
  );
}

/** Laporan — dokumen editorial dengan lipatan halaman, bukan file icon generik (Bagian XXXIV). */
export function IconLaporan(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h7" />
      <path d="M9 16h7" />
    </svg>
  );
}

/** Riwayat — layered timeline / progresi melingkar, bukan clock icon generik (Bagian XXXV). */
export function IconRiwayat(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}
